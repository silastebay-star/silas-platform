export default function TestStylingPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center mb-8">SILAS Styling Test</h1>
        
        {/* Test SILAS Colors */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">SILAS Brand Colors</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-silas-green text-white p-6 rounded-lg">
              <h3 className="font-semibold">SILAS Green</h3>
              <p>bg-silas-green</p>
              <p className="text-sm opacity-90">#4C764C</p>
            </div>
            <div className="bg-silas-dark text-white p-6 rounded-lg">
              <h3 className="font-semibold">SILAS Dark</h3>
              <p>bg-silas-dark</p>
              <p className="text-sm opacity-90">#1C1F1C</p>
            </div>
            <div className="bg-silas-light text-silas-dark p-6 rounded-lg border">
              <h3 className="font-semibold">SILAS Light</h3>
              <p>bg-silas-light</p>
              <p className="text-sm opacity-70">#E6F0E6</p>
            </div>
          </div>
        </div>

        {/* Test Typography */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Typography</h2>
          <div className="space-y-2">
            <h1 className="text-4xl font-heading text-silas-green">Heading 1 - Orbitron</h1>
            <h2 className="text-3xl font-heading text-silas-green">Heading 2 - Orbitron</h2>
            <h3 className="text-2xl font-heading text-silas-green">Heading 3 - Orbitron</h3>
            <p className="text-lg">Regular paragraph text using Inter font family</p>
          </div>
        </div>

        {/* Test Custom Components */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Custom Components</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="silas-card">
              <h3 className="text-xl font-semibold mb-2">SILAS Card</h3>
              <p>This uses the .silas-card class with hover effects</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-2">Standard Card</h3>
              <p>This uses standard Tailwind classes</p>
            </div>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <button className="silas-button">SILAS Button</button>
            <button className="bg-silas-green text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all">
              Tailwind Button
            </button>
            <button className="bg-silas-green hover:bg-silas-green/90 text-white px-6 py-3 rounded-lg transition-colors">
              Hover Test
            </button>
          </div>
        </div>

        {/* Test Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Styling Test Results</h3>
          <ul className="space-y-1 text-green-700">
            <li>• SILAS brand colors should be visible</li>
            <li>• Orbitron font should be used for headings</li>
            <li>• Inter font should be used for body text</li>
            <li>• Hover effects should work on cards and buttons</li>
            <li>• All custom CSS classes should be applied</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
