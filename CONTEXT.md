# Domain Glossary & Context

### User & Session Terms

- **Session User**: The authenticated user identity bound to the current incoming request session headers.
- **Server Action Auth Guard**: The mandatory authentication check evaluated at the entry point of every Server Action to guarantee that an operation is performed exclusively on behalf of an authenticated Session User.
- **Ghost Member**: A non-registered user placeholder within a shared group before linking or claiming a profile.
