# Terralyt Frontend

Terralyt is a multi-tenant Enterprise ESG (Environmental, Social, and Governance) management system designed to track, calculate, audit, and report greenhouse gas (GHG) emissions. This repository contains the React, TypeScript, and custom CSS single-page application (SPA) client interface.

![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge&logo=open-source-initiative&logoColor=white)  
![Made with React](https://img.shields.io/badge/Made%20with-React-blue?style=for-the-badge&logo=react&logoColor=white)  
![Built with Vite](https://img.shields.io/badge/Built%20with-Vite-purple?style=for-the-badge&logo=vite&logoColor=white)  

---

## Key Features

* **Interactive Dashboards** - Visualize carbon footprint metrics, GHG scopes (Scope 1, 2, and 3), facility breakdowns, and reduction targets.
* **Upload Center** - Analyst drag-and-drop workspace to upload CSV data spreadsheets and monitor real-time ingestion status logs.
* **Review Verification Queue** - Reviewer dashboard to audit pending entries, examine anomalies, submit comments, and approve/reject records.
* **Facility Management** - Admin registry workspace to map and manage physical facilities, warehouses, and offices.
* **Audit Ledger** - Compliance view displaying system activity trails and delta comparisons (old vs. new values).
* **Target Settings** - Adjust baseline years, target reduction percentages, and emissions standards.

---

## Live Demo

Experience the live application: [Terralyt Web App](https://breatheesg-backend-tnlv.onrender.com) (Served from the integrated production hosting)

---

## Tech Stack

### Frontend Core
* **React** (18+) - Core UI component library.
* **Vite** (5+) - Next-generation frontend tooling and build server.
* **TypeScript** - Strongly typed JavaScript compiler for code safety.
* **Tailwind CSS** - Utility-first styling framework for responsive design.
* **React Router DOM** - Client-side declarative routing manager.
* **Axios** - HTTP client request handler for REST API integration.

### Backend API
The frontend interacts with the Django REST API backend to support:
* **Authentication** - JWT session access token issuance and validation.
* **Ingestion** - File uploads and processing status trackers.
* **Verification Queue** - Record status updates and commenting engines.
* **Audit Trail** - Fetching system logs and database metrics.

---

## Getting Started

### Prerequisites

* **Node.js (v18+)** - Required for running the frontend local node environment.
* **npm** - Package manager included with Node.js.

---

### Installation

1. Clone the repository and navigate to the frontend folder:
   ```bash
   git clone https://github.com/shk-khalid/breatheESG-frontend.git
   cd breatheESG-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

---

## Environment Variables

To run this project, create a `.env` file in the frontend root directory and add the following variables:

```env
VITE_API_URL=http://localhost:8000
```

---

## API Integration

The primary endpoints consumed by the frontend client include:

### Authentication
* `POST /api/token/` - User login JWT token creation.
* `POST /api/token/refresh/` - Session verification refresh.

### Facility Hub
* `GET /api/tenants/facilities/` - List all active facilities.
* `POST /api/tenants/facilities/` - Create a new facility entry.

### Ingestion Center
* `POST /api/ingestion/upload/` - Upload raw CSV sheet.
* `GET /api/ingestion/history/` - Fetch ingestion history logs.

### Review Workspace
* `GET /api/review/queue/` - Access pending carbon emission records.
* `POST /api/review/records/{id}/approve/` - Confirm and lock calculated emissions.

---

## State Management

The frontend leverages React Context providers and local component hooks for state management:
* **Auth Context** - Handles login, permissions roles, and authentication tokens.
* **Tenant Context** - Stores selected facilities, target parameters, and calculation configurations.

---

## Deployment

### Frontend Build
To compile the static React SPA files for production hosting:
```bash
npm run build
```
Deploy the resulting contents of the `dist/` directory to platforms such as Vercel, Netlify, or Static Storage hosts.

---

## Contributing

Contributions are welcome! Follow these steps:

1. Fork the repository.
2. Create a feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add an amazing feature"
   ```
4. Push your branch:
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request for review.

---

## Testing

* Run frontend unit and component tests:
   ```bash
   npm run test
   ```

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Contact

For questions or collaboration opportunities, feel free to reach out:

Khalid Shaikh - shk.khalid18@gmail.com
Project Repository: [Terralyt](https://github.com/shk-khalid/Terralyt.git)
Front-end Repository: [breatheESG-frontend](https://github.com/shk-khalid/breatheESG-frontend.git)
