import "./globals.css";

export const metadata = {
  title: "LifeOS",
  description: "Design your retirement. Engineer your days."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
