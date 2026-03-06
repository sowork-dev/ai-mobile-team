import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      style={
        {
          "--normal-bg": "#F5F1E8",
          "--normal-text": "#1A1A1A",
          "--normal-border": "#1A1A1A",
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          background: "#F5F1E8",
          color: "#1A1A1A",
          border: "1px solid #1A1A1A",
        },
        classNames: {
          error: "!bg-red-50 !text-red-900 !border-red-500",
          success: "!bg-green-50 !text-green-900 !border-green-500",
          warning: "!bg-yellow-50 !text-yellow-900 !border-yellow-500",
          info: "!bg-blue-50 !text-blue-900 !border-blue-500",
          description: "!text-inherit",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
