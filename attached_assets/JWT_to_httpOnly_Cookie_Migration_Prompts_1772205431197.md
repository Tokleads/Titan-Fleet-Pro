# JWT to httpOnly Cookie Migration Prompts

Here are the two focused prompts for Replit AI to migrate your authentication from `localStorage` to secure `httpOnly` cookies. Run them one after the other.

---

## Prompt 1: Server-Side Changes

**Goal:** Update the backend to set and read JWTs from `httpOnly` cookies instead of the JSON body.

```
I need to improve security by moving our JWT authentication from localStorage to httpOnly cookies. This is Part 1, focusing only on the server-side changes.

**Step 1: Install and configure `cookie-parser`**

First, add the necessary package:

```shell
pnpm add cookie-parser @types/cookie-parser
```

Then, in `server/index.ts`, import it and add it as global middleware near the top, right after `express.json()`:

```typescript
// In server/index.ts
import cookieParser from 'cookie-parser';

// ... after app.use(express.json());
app.use(cookieParser());
```

**Step 2: Update Login Endpoints to Set Cookies**

Modify the three login endpoints (manager, driver, and admin) to set a secure, `httpOnly` cookie and remove the token from the JSON response.

1.  **Manager Login:** In `server/routes.ts`, around line 1248, find this code:

    ```typescript
    const token = signToken({ ... });
    res.json({
      manager: { ... },
      company: { ... },
      token,
    });
    ```

    Change it to this:

    ```typescript
    const token = signToken({ ... });
    res.cookie('auth_token', token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'strict', 
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    res.json({
      manager: { ... },
      company: { ... },
      // The token is now in the cookie, not the body
    });
    ```

2.  **Driver Login:** In `server/routes.ts`, around line 1168, do the exact same change for the driver login response.

3.  **Admin Login:** In `server/adminRoutes.ts`, around line 43, change the admin login response to set the cookie instead of returning `adminToken` in the body.

**Step 3: Update Token Extraction to Read from Cookies**

In `server/jwtAuth.ts`, modify the `extractToken` function to read from the new cookie first, falling back to the old `Authorization` header for a smooth transition.

```typescript
// In server/jwtAuth.ts
export function extractToken(req: Request): string | null {
  // 1. Check for the token in the httpOnly cookie first
  if (req.cookies && req.cookies.auth_token) {
    return req.cookies.auth_token;
  }

  // 2. Fallback to the Authorization header for transition
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
}
```

**Step 4: Create a Logout Endpoint**

In `server/authRoutes.ts`, add a new endpoint to clear the authentication cookie.

```typescript
// In server/authRoutes.ts
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token').json({ message: 'Logged out successfully' });
});
```

After applying these changes, restart the server to ensure everything is working correctly before proceeding to Part 2.
```

---

## Prompt 2: Client-Side Changes

**Goal:** Update the frontend to remove all `localStorage` token handling and rely on the browser's automatic cookie management.

```
This is Part 2 of moving our JWT to `httpOnly` cookies. The server is now setting cookies. Your task is to remove all client-side code that manually handles the JWT in `localStorage`.

**Step 1: Remove Manual `Authorization` Header from `fetch`**

In `client/src/main.tsx`, the app has a global `fetch` interceptor that manually adds the `Authorization` header. This is no longer needed, as the browser will send the `httpOnly` cookie automatically. 

**Delete the entire `window.fetch` override block** from `client/src/main.tsx` (approximately lines 6-21).

**Step 2: Remove Token Handling from Session Library**

In `client/src/lib/session.ts`, the `session` object has functions for storing and retrieving the token from `localStorage`. These are now obsolete.

1.  Delete the `setToken` method.
2.  Delete the `getToken` method.
3.  In the `clear()` method, remove the line `localStorage.removeItem("fleetcheck_token");`

**Step 3: Remove `setToken` Calls from Login Pages**

On the login pages, the code calls `session.setToken(data.token)` after a successful login. This needs to be removed.

1.  In `client/src/pages/manager/ManagerLogin.tsx`, find and delete the line `session.setToken(data.token);` (around line 73).
2.  In `client/src/pages/driver/DriverLogin.tsx`, find and delete the equivalent `session.setToken(data.token);` line.
3.  In `client/src/pages/admin/AdminLogin.tsx`, find and delete the line `localStorage.setItem("titan_admin_token", data.adminToken);` (around line 36).

**Step 4: Update Logout Functionality**

Update the main logout function to call the new `/api/auth/logout` endpoint. This will likely be in a layout component like `ManagerLayout.tsx` or a user menu component.

Find the `handleLogout` or equivalent function that currently calls `session.clear()` and redirects. Modify it to first make a `POST` request to `/api/auth/logout` before clearing the local session data and redirecting.

Example:

```typescript
// In the relevant component (e.g., UserNav.tsx or ManagerLayout.tsx)
import { apiRequest } from "@/lib/queryClient"; // Make sure this is imported

const handleLogout = async () => {
  try {
    await apiRequest("POST", "/api/auth/logout");
  } catch (error) {
    console.error("Logout failed:", error);
  } finally {
    session.clear();
    window.location.href = "/manager/login";
  }
};
```

By completing these steps, the application will be fully migrated to using secure `httpOnly` cookies for authentication, and all manual token handling will be removed from the client-side code.
```
