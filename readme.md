# AI Chat Interface: Inspect Functionality

This interface lets users generate an AI prompt by selecting elements on the page. The prompt is built from the element's text plus additional context extracted via data attributes.

## How to Use

### 1. Marking Inspectable Elements

Add the `data-ai-inspect` attribute to any element to make it inspectable. This can be used on its own or alongside the attributes described below. The value of the attribute is ignored but can be present if you need it for something else.
By default it will pull the text from the element and its children.

_Example:_

```html
<div data-ai-inspect>Sample text <span>with child</span></div>
```

Output: "Sample text with child"

### 2. Adding Additional Context

#### a. Custom Context

Use `data-ai-context` to provide custom context. If the attribute is absent or empty, it will be ignored.
If it is present, its value will be used as the context and will be used as the start of the prompt and will disable the default behaviour of pulling text from the element and its children.
To re-enable that, use the `data-ai-get-text-from-depth` attribute.

_Example:_

```html
<p data-ai-inspect data-ai-context="Explain me">Paragraph content here.</p>
```

Output: "Explain me"

#### b. Text Extraction Depth

The `data-ai-get-text-from-depth` attribute dictates how many levels of child elements should be included:

- **0 (or absent):** Only the element's own text is used.
- **1:** Includes text from direct children.
- **2:** Includes text from grandchildren, etc.
- **all:** Includes text from all descendants.

_Example:_

```html
<div data-ai-inspect data-ai-get-text-from-depth="1">
  Parent text
  <span>Child text</span>
</div>
```

_Output:_
"Parent text Child text"

_Example:_

```html
<div
  data-ai-inspect
  data-ai-context="Explain"
  data-ai-get-text-from-depth="all"
>
  Parent text
  <span>Child text</span>
</div>
```

_Output:_
"Explain Parent text Child text"

#### c. Context from Specific Selectors

Use `data-ai-context-from-selectors` to list CSS selectors, separated by commas, for targeting additional elements. This extracts the text (and text from all children) for each matching element. If a target element has its own `data-ai-context`, that value is used instead.

_Example:_

```html
<div data-ai-inspect data-ai-context-from-selectors=".extra, #note">
  Main content
</div>
<p class="extra">Extra detail here</p>
<span id="note" data-ai-context="Custom note"></span>
```

_Output:_
"Main content Extra detail here Custom note"

#### d. Prefixes and Suffixes

Use the following attributes to add extra text before or after the context from selectors:

- **Prefixes:**
  `data-ai-context-from-selectors-prefixes` is a semicolon (;) separated list of prefixes for each selector match. Skip a prefix by leaving the value empty.

  _Example:_ `"Prefix1;;Prefix3"`

- **Suffixes:**
  `data-ai-context-from-selectors-suffixes` is a semicolon (;) separated list of suffixes for each selector match. Skip a suffix by using an empty value.

  _Example:_ `"Suffix1;Suffix2;Suffix3"`

  _Combined Example:_

  ```html
  <div
    data-ai-inspect
    data-ai-context-from-selectors=".extra, #note"
    data-ai-context-from-selectors-prefixes="P1;P2"
    data-ai-context-from-selectors-suffixes="S1;S2"
  >
    Main content
  </div>
  <p class="extra">Extra info</p>
  <span id="note" data-ai-context="Note detail"></span>
  ```

  _Output Construction:_

  - For selector `.extra`: "P1 Extra info S1"
  - For selector `#note`: "P2 Note detail S2"

  The final prompt context will be a concatenation of:
  "P1 Extra info S1 P2 Note detail S2"

All the context extracted (in the order described above) is concatenated into a single string - separated by a space - that the AI will use as its prompt.

#### e. Displayed message

`data-ai-displayed-message` is the text that will be displayed in the chat interface.

- If this attribute is absent, the default is to display the entire context defined in the above attributes.
- If this attribute is present, it will be used as the displayed message instead of the context defined above. If it's present but empty, no text will be displayed in the UI.

## Possible Enhancements

1. **Configuration File:**
   Move the mapping between data attributes and their extraction methods into an external configuration file. This makes it easy to add or alter attributes without changing the core logic.

   _Example Configuration (JSON):_

   ```json
   {
     "attributes": {
       "inspect": "data-ai-inspect",
       "context": "data-ai-context",
       "depth": "data-ai-get-text-from-depth",
       "fromSelectors": "data-ai-context-from-selectors",
       "prefixes": "data-ai-context-from-selectors-prefixes",
       "suffixes": "data-ai-context-from-selectors-suffixes"
     },
     "extractionOrder": ["context", "depth", "fromSelectors"]
   }
   ```

2. **Configure each element you want inspected in the DOM from a configuration file.**

   _Example Configuration (JSON):_

   ```json
   {
     "[data-ai-inspect='filter-menu-item']": {
       "context": "Explain this filter: ",
       "getTextFromDepth": 0,
       "contextFromSelectors": ".filter-menu-label, .main-menu-selected"
     },

     "[data-ai-inspect='table-heading']": {
       "context": "Explain this business request attribute type: ",
       "getTextFromDepth": 0,
       "contextFromSelectors": ".table-title"
     }
   }
   ```

## Chat Bot Configuration

The chat bot component can be configured using both HTML attributes and JavaScript. Configuration is stored in the global `window.EIDChat` object.

### Core Configuration

The following core configuration options are available:

- **serverUrl**: The URL of the SignalR server
- **moduleId**: The ID of the chat module to use

These can be set via HTML attributes:

```html
<chat-bot
  server-url="https://example.com/signalr"
  module-id="chat-module"
></chat-bot>
```

Or via JavaScript:

```javascript
// Initialize if needed
if (!window.EIDChat) window.EIDChat = { SystemParams: {} };

// Set core configuration
window.EIDChat.serverUrl = "https://example.com/signalr";
window.EIDChat.moduleId = "chat-module";
```

### System Parameters

System parameters are sent to the server when the connection is established or reconnected. Each parameter is sent individually using the format `SetContext(key=value)`.

System parameters are stored in `window.EIDChat.SystemParams` and can include:

- **Language**: The language to use for the chat (e.g., 'en-US', 'fr-FR')
- **AuthToken**: Authentication token for the user
- Any other custom parameters needed by the server

These can be set via JavaScript:

```javascript
// Initialize if needed
if (!window.EIDChat) window.EIDChat = { SystemParams: {} };
if (!window.EIDChat.SystemParams) window.EIDChat.SystemParams = {};

// Set system parameters
window.EIDChat.SystemParams.Language = "en-US";
window.EIDChat.SystemParams.AuthToken = "your-auth-token";
window.EIDChat.SystemParams.CustomParam = "value";
```

Or using the public method on the chat-bot element:

```javascript
const chatBot = document.querySelector("chat-bot");
chatBot.setSystemParams({
  Language: "en-US",
  AuthToken: "your-auth-token",
  CustomParam: "value",
});
```

### Connection Behavior

- The connection is only established when the chat is first opened
- The connection remains active even when the chat UI is hidden
- The connection will automatically reconnect if it drops
- System parameters are automatically re-sent when the connection is reestablished

### TypeScript Integration

When using TypeScript, extend the Window interface to include the EIDChat property:

```typescript
interface Window {
  EIDChat?: {
    serverUrl?: string;
    moduleId?: string;
    SystemParams: Record<string, string>;
  };
}
```

Then use null checks before accessing EIDChat properties:

```typescript
if (!window.EIDChat) window.EIDChat = { SystemParams: {} };
if (!window.EIDChat.SystemParams) window.EIDChat.SystemParams = {};

window.EIDChat.SystemParams.AuthToken = "your-auth-token";
```
