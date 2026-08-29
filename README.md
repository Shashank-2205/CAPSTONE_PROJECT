# ResQNet App - Main Project Folder

This is the actual runnable application folder for the project.

## Folder structure

```text
CAPSTONE_PROJECT/
├── client/                 # Frontend app
│   ├── src/                # React components and pages
│   └── package.json        # frontend scripts and dependencies
├── server/                 # Backend API
│   ├── src/                # Express routes, middleware, config
│   └── package.json        # backend scripts and dependencies
├── package.json            # root scripts to run both frontend and backend
├── .env.example            # environment variable template
├── README.md               # project overview
├── .gitignore
└── node_modules/
```

## Where to look

- Frontend code: [client](client)
- Backend code: [server](server)
- Root run scripts: [package.json](package.json)

## Start the app

From this folder run:

```bash
npm install
npm run dev
```

This starts:
- frontend: Vite dev server
- backend: Express server

## Documentation

The project specification and planning files are kept in the parent folder, not inside this app folder:

- [../README.md](../README.md)
- [../API.md](../API.md)
- [../BACKEND.md](../BACKEND.md)
- [../DATABASE.md](../DATABASE.md)
- [../FRONTEND.md](../FRONTEND.md)
- [../IMPLEMENTATION.md](../IMPLEMENTATION.md)

## Project summary

ResQNet is an intelligent emergency response and resource management platform for citizens, volunteers, NGOs, hospitals, and government authorities during disaster events.
