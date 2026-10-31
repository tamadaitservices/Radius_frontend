/** Red helper text under a form field; renders nothing when there is no message. */
export default function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs font-semibold text-red-600 mt-1">
      {message}
    </p>
  );
}

/** Border colour classes for an input: red when it has an error. */
export const fieldBorder = (error?: string | null) =>
  error ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-green-600';
