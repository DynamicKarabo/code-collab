declare module 'y-websocket' {
    import * as Y from 'yjs';
    export class WebsocketProvider {
        constructor(serverUrl: string, roomname: string, doc: Y.Doc, options?: any);
        disconnect(): void;
        destroy(): void;
        awareness: any;
        on(event: string, handler: (event: any) => void): void;
    }
}

declare module 'y-monaco' {
    import * as Y from 'yjs';
    import * as Monaco from 'monaco-editor';

    export class MonacoBinding {
        constructor(
            ytext: Y.Text,
            model: Monaco.editor.ITextModel | null,
            editors: Set<Monaco.editor.IStandaloneCodeEditor> | null,
            awareness?: any
        );
        destroy(): void;
    }
}

declare module 'xterm-addon-fit' {
    import { ITerminalAddon, Terminal } from 'xterm';
    export class FitAddon implements ITerminalAddon {
        activate(terminal: Terminal): void;
        dispose(): void;
        fit(): void;
    }
}

declare module 'randomcolor' {
    function randomColor(options?: any): string;
    export = randomColor;
}
