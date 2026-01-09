# PortalSync Frontend

React + TypeScript frontend for PortalSync - HR Automation System for Social Security Fund (SSF) and AIA Group Insurance registration tracking.

## 🚀 Features

- Real-time dashboard with employee statistics
- Employee management interface
- Portal synchronization workflow tracking
- Worksite configuration
- Summary reports and analytics
- Beautiful UI with Tailwind CSS

## 🛠️ Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Recharts (for data visualization)
- Axios (for API calls)

## 📦 Installation

1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/portalsync-frontend.git
cd portalsync-frontend
```

2. Install dependencies
```bash
npm install
```

3. Run development server
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 🔗 Backend Connection

This frontend connects to the Django backend API. Make sure the backend is running on `http://127.0.0.1:8000`

API service configuration is in `services/apiService.ts`

## 🏗️ Project Structure

```
portalsync-frontend/
├── components/       # React components
│   ├── Dashboard.tsx
│   ├── EmployeePage.tsx
│   ├── PortalSync.tsx
│   ├── SummaryReport.tsx
│   ├── WorksiteConfig.tsx
│   └── Layout.tsx
├── services/         # API services
│   └── apiService.ts
├── types.ts          # TypeScript type definitions
├── App.tsx           # Main app component
└── index.tsx         # Entry point
```

## 📱 Pages

- **Dashboard** - Overview with statistics and trends
- **Employee** - Employee management and registration
- **Portal Sync** - SSF/AIA workflow tracking
- **Summary & Report** - Analytics and reporting
- **Worksite** - Location configuration

## 🎨 Design System

- **Colors**: Blue (SSF), Rose (AIA), Emerald (Success), Amber (Warning)
- **Fonts**: Inter
- **Icons**: Font Awesome 6.4
- **Styling**: Tailwind CSS utility classes

## 👨‍💻 Development

Built as part of a 4-month internship project (January - May 2026) focused on HR automation in Thailand.

## 📝 License

Private - Internal company use only