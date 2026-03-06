/**
 * AI Mobile Team - Main App Component
 * 獨立的 Mobile Web App 入口
 */
import MobileApp from "./mobile/MobileApp";
import { Toaster } from "sonner";

export default function App() {
  return (
    <>
      <MobileApp />
      <Toaster position="top-center" richColors />
    </>
  );
}
