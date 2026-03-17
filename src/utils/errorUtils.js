export function reportError(context, error) {
  console.error(`[${context}]`, error);
}

export function friendlyErrorMessage(message = 'Something went wrong. Please try again.') {
  return message;
}

