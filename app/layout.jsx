import './globals.css';

export const metadata = {
  title: 'OrigenRP — Panel Staff',
  description: 'Panel interno de staff para el servidor FiveM OrigenRP',
  icons: {
    icon: 'https://cdn.discordapp.com/icons/1009180572624629791/a_e19b1091b6f96da1e60781a281dcd96f.webp?size=32'
  }
};

const themeScript = `
(function() {
  try {
    const t = localStorage.getItem('theme') || 'light';
    document.documentElement.dataset.theme = t;
  } catch(e) {
    document.documentElement.dataset.theme = 'light';
  }
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="gate-shown" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
