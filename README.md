# Wolfsonian Art Collection Dashboard

Inspired by the collections at The Wolfsonian–FIU, this project presents an interactive dashboard to explore and visualize data about art pieces. It allows users to filter and group the collection by various features like year, country of origin, material, and more, displaying the results in dynamic bar and pie charts.

## ✨ Features

* **Data Visualization:** View art collection data aggregated using bar and pie charts.
* **Interactive Filtering:** Select features (Year, Country, Material, etc.) to group and analyze the data.
* **Chart Type Selection:** Switch between Bar Chart and Pie Chart views for different perspectives.
* **Responsive Design:** Built with Tailwind CSS for adaptability across different screen sizes.
* **Client-Side Rendering:** Leverages React and Next.js for a dynamic user experience.

## 🚀 Technologies Used

* **Framework:** [Next.js](https://nextjs.org/) (App Router)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **UI Components:** [React](https://reactjs.org/)
* **Linting/Formatting:** ESLint (based on `eslint.config.mjs`)

## 📊 Data Source

The dashboard visualizes data from the `public/art_data.csv` file included in this repository. This CSV contains information about various art pieces, which is processed and displayed in the charts.

## ⚙️ Getting Started

Follow these steps to get the project running locally:

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd wolfsonian-frontend
    ```

2.  **Install dependencies:**
    Choose your preferred package manager:
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    # or
    bun install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    # or
    bun dev
    ```

4.  **Open the application:**
    Open [http://localhost:3000](http://localhost:3000) in your web browser to see the dashboard.

## 📁 Project Structure

```
wolfsonian-frontend/
├── README.md           # This file
├── next.config.ts      # Next.js configuration
├── package.json        # Project dependencies and scripts
├── tailwind.config.ts  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
├── public/             # Static assets
│   ├── art_data.csv    # The dataset used by the dashboard
│   └── images/         # Placeholder for images (if any)
└── src/                # Source code
├── app/            # Next.js App Router directory
│   ├── globals.css # Global styles
│   ├── layout.tsx  # Main application layout
│   └── page.tsx    # Main page component, renders the dashboard
└── components/
└── dashboard.tsx # The core dashboard component (fetching, filtering, charting logic)
```

## 🙏 Acknowledgements

This project is inspired by the collections at [The Wolfsonian–FIU](https://wolfsonian.org/), a museum that illustrates the persuasive power of art and design.
