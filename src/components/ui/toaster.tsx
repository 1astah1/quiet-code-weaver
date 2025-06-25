import { useToast } from "@/components/ui/toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  // Only log if there are toasts to reduce console spam
  if (toasts.length > 0) {
    console.log('🍞 [TOASTER] Component rendering:', {
      toastCount: toasts.length,
      toasts: toasts.map(t => ({ id: t.id, title: t.title, variant: t.variant }))
    });
  }

  return (
    <>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </>
  )
}
