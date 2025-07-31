// tailwind.config.js
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,html}', // Adjust according to your project structure
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        'inter-semibold': ['Inter-Semibold', 'sans-serif'],
        'inter-bold': ['Inter-Bold', 'sans-serif'],
        'inter-regular': ['Inter-Regular'],
      },
      colors: {
        primary: '#F59E0B',
        secondary: '#ffb700',
      },
    },
  },
  plugins: [],
}
