import { useToast } from "@/components/ui/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider as ToastProviderComponent,
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
    <ToastProviderComponent>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        console.log('🍞 [TOASTER] Rendering toast:', { id, title, variant: props.variant });
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProviderComponent>
  )
}
