# SimpleCheckout React Native Example

This example demonstrates how to integrate SimpleCheckout's Hosted Connect in a React Native app using Expo.

> **Note:** This example includes a debug panel that displays all messages received from the WebView. This is useful during development to see the message flow, but should be removed in your production app.

## Quick Start

```bash
# Install dependencies
npm install

# Start the Expo development server
npx expo start

# Press 'i' for iOS simulator or 'a' for Android emulator
```

## Configuration

Before running, update the configuration in `App.tsx`:

```typescript
const PUBLISHABLE_KEY = 'pk_sandbox_YOUR_KEY_HERE';  // From SimpleCheckout dashboard
const CUSTOMER_ID = 'your-customer-uuid';            // Your customer's ID
const LOGIN_SOURCE_ID = 'your-login-source-uuid';    // The login source to connect
```

## How It Works

The app loads SimpleCheckout's Hosted Connect page in a WebView. When the user completes the flow (success or error), the page sends a message back to your app via `postMessage`.

```
+----------------------------------+
|       Your React Native App      |
|  +----------------------------+  |
|  |          WebView           |  |
|  |  +----------------------+  |  |
|  |  |  Hosted Connect Page |  |  |
|  |  |  (simplecheckout.ai) |--+--+--> postMessage({ type, payload })
|  |  +----------------------+  |  |
|  +----------------------------+  |
|              |                   |
|              v                   |
|       onMessage handler          |
+----------------------------------+
```

## URL Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `publishable_key` | Yes | Your publishable API key |
| `customer_id` | Yes | The customer's UUID |
| `login_source_id` | Yes | The login source UUID to connect |
| `redirect_url` | No | URL to redirect after success (optional) |

## Message Types

The WebView sends JSON messages with this structure:

```typescript
interface BridgeMessage {
  type: 'SUCCESS' | 'ERROR';
  payload: SuccessPayload | ErrorPayload;
}
```

### SUCCESS

Sent when the user successfully connects their account.

```typescript
{
  type: 'SUCCESS',
  payload: {
    id: 'account-uuid',           // The connected account ID
    customer_id: 'customer-uuid', // The customer ID
    login_source_id: 'source-uuid', // The login source ID
    login_status: 'LOGGED_IN'     // Account status
  }
}
```

**Your app should:** Close the WebView and save the account ID.

### ERROR

Sent when something goes wrong.

```typescript
{
  type: 'ERROR',
  payload: {
    code: 'INVALID_CREDENTIALS',
    message: 'The password you entered is incorrect'
  }
}
```

## Error Codes

| Code | When | Recommended Action |
|------|------|-------------------|
| `CONFIGURATION_ERROR` | Missing/invalid URL parameters | Check your integration setup |
| `INVALID_CREDENTIALS` | User entered wrong credentials | Show error, let user retry |
| `CONNECTION_FAILED` | Network or server error | Show "try again later" message |

## Example: Handling Messages

```typescript
const handleMessage = (event: WebViewMessageEvent) => {
  const data: BridgeMessage = JSON.parse(event.nativeEvent.data);

  if (data.type === 'SUCCESS') {
    const { id, login_status } = data.payload as SuccessPayload;

    // Save the account ID
    saveAccountId(id);

    // Close the WebView and go back
    navigation.goBack();

  } else if (data.type === 'ERROR') {
    const { code, message } = data.payload as ErrorPayload;

    switch (code) {
      case 'INVALID_CREDENTIALS':
        // Let the user retry - the WebView stays open
        Alert.alert('Error', message);
        break;

      case 'CONNECTION_FAILED':
        Alert.alert('Connection Error', 'Please try again later.');
        break;

      case 'CONFIGURATION_ERROR':
        // This shouldn't happen in production
        console.error('Configuration error:', message);
        break;
    }
  }
};
```

## Production Integration

For production use, you'll typically:

1. Present the WebView in a modal or dedicated screen
2. Pass real customer/login source IDs from your backend
3. Close the WebView on SUCCESS and navigate the user appropriately
4. Handle errors gracefully with user-friendly messages

## Requirements

- Expo SDK 54+
- react-native-webview 13+
- iOS 13+ or Android 5+
