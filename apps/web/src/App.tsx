import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';

/**
 * Root application component.
 * Route definitions and the global Toaster live here.
 * Feature pages will be added in subsequent prompts.
 */
export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<div className="p-8 text-foreground">QIT — routes coming soon</div>} />
      </Routes>

      {/* Toaster renders active toast notifications at the viewport edge */}
      <Toaster />
    </>
  );
}
