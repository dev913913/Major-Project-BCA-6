import { useCallback, useEffect, useId, useRef, useState } from 'react';

type PythonRunnerProps = {
  starterCode?: string;
  readOnly?: boolean;
};

type MonacoEditor = {
  getValue: () => string;
  setValue: (value: string) => void;
  dispose: () => void;
  layout: () => void;
  updateOptions: (options: { readOnly?: boolean; domReadOnly?: boolean }) => void;
};

type Monaco = {
  editor: {
    create: (
      element: HTMLElement,
      options: {
        value: string;
        language: string;
        theme: string;
        automaticLayout: boolean;
        minimap: { enabled: boolean };
        fontSize: number;
        lineNumbersMinChars: number;
        padding: { top: number; bottom: number };
        scrollBeyondLastLine: boolean;
        wordWrap: string;
        readOnly: boolean;
        domReadOnly: boolean;
      },
    ) => MonacoEditor;
  };
};

type Pyodide = {
  globals: {
    set: (name: string, value: unknown) => void;
  };
  runPythonAsync: (code: string) => Promise<unknown>;
};

type PythonResult = {
  stdout: string;
  stderr: string;
  error: string;
};

type PyProxy = {
  toJs: (options?: { dict_converter?: ObjectConstructor }) => unknown;
  destroy?: () => void;
};

type WindowWithRunners = Window & {
  monaco?: Monaco;
  require?: {
    config: (options: { paths: { vs: string } }) => void;
    (modules: string[], onLoad: (monaco: Monaco) => void, onError?: (error: Error) => void): void;
  };
  loadPyodide?: (options: { indexURL: string }) => Promise<Pyodide>;
};

const MONACO_VERSION = '0.52.2';
const MONACO_BASE_URL = `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min/vs`;
const MONACO_LOADER_URL = `${MONACO_BASE_URL}/loader.js`;
const PYODIDE_VERSION = '0.28.0';
const PYODIDE_BASE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const PYODIDE_SCRIPT_URL = `${PYODIDE_BASE_URL}pyodide.js`;

let monacoPromise: Promise<Monaco> | null = null;
let pyodidePromise: Promise<Pyodide> | null = null;

function loadScriptOnce(src: string, id: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;

    if (existing?.dataset.loaded === 'true') {
      resolve();
      return;
    }

    const script = existing ?? document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));

    if (!existing) document.head.appendChild(script);
  });
}

function getMonaco() {
  if (!monacoPromise) {
    monacoPromise = loadScriptOnce(MONACO_LOADER_URL, 'monaco-editor-loader').then(
      () =>
        new Promise<Monaco>((resolve, reject) => {
          const browserWindow = window as WindowWithRunners;

          if (browserWindow.monaco) {
            resolve(browserWindow.monaco);
            return;
          }

          if (!browserWindow.require) {
            reject(new Error('Monaco loader is unavailable.'));
            return;
          }

          browserWindow.require.config({ paths: { vs: MONACO_BASE_URL } });
          browserWindow.require(['vs/editor/editor.main'], resolve, reject);
        }),
    );
  }

  return monacoPromise;
}

function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = loadScriptOnce(PYODIDE_SCRIPT_URL, 'pyodide-runtime').then(async () => {
      const browserWindow = window as WindowWithRunners;

      if (!browserWindow.loadPyodide) {
        throw new Error('Pyodide loader is unavailable.');
      }

      return browserWindow.loadPyodide({ indexURL: PYODIDE_BASE_URL });
    });
  }

  return pyodidePromise;
}

function toPythonString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function isPyProxy(value: unknown): value is PyProxy {
  return typeof value === 'object' && value !== null && 'toJs' in value;
}

function normalizePythonResult(value: unknown): PythonResult {
  const converted = isPyProxy(value) ? value.toJs({ dict_converter: Object }) : value;

  if (typeof converted === 'object' && converted !== null) {
    const result = converted as Partial<PythonResult>;

    return {
      stdout: toPythonString(result.stdout),
      stderr: toPythonString(result.stderr),
      error: toPythonString(result.error),
    };
  }

  return { stdout: '', stderr: '', error: 'Python returned an unexpected result.' };
}

const RUNNER_SCRIPT = `
import contextlib
import io
import traceback

_stdout = io.StringIO()
_stderr = io.StringIO()
_error = ""

exec(__codev_user_code__, {"__builtins__": __builtins__})

{
    "stdout": _stdout.getvalue(),
    "stderr": _stderr.getvalue(),
    "error": _error,
}
`;

function PythonRunner({ starterCode = 'print("Hello from Python!")', readOnly = false }: PythonRunnerProps) {
  const editorId = useId();
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<MonacoEditor | null>(null);
  const [code, setCode] = useState(starterCode);
  const [isEditorLoading, setIsEditorLoading] = useState(true);
  const [isPyodideLoading, setIsPyodideLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('Run the code to see output here.');
  const [error, setError] = useState('');

  useEffect(() => {
    setCode(starterCode);
    editorRef.current?.setValue(starterCode);
  }, [starterCode]);

  useEffect(() => {
    let isMounted = true;

    async function createEditor() {
      try {
        const monaco = await getMonaco();

        if (!isMounted || !editorContainerRef.current || editorRef.current) return;

        editorRef.current = monaco.editor.create(editorContainerRef.current, {
          value: starterCode,
          language: 'python',
          theme: 'vs-dark',
          automaticLayout: true,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbersMinChars: 3,
          padding: { top: 14, bottom: 14 },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          readOnly,
          domReadOnly: readOnly,
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load Monaco Editor.');
      } finally {
        if (isMounted) setIsEditorLoading(false);
      }
    }

    createEditor();

    return () => {
      isMounted = false;
      editorRef.current?.dispose();
      editorRef.current = null;
    };
  }, [editorId, readOnly, starterCode]);

  useEffect(() => {
    editorRef.current?.updateOptions({ readOnly, domReadOnly: readOnly });
  }, [readOnly]);

  const runCode = useCallback(async () => {
    const runnableCode = editorRef.current?.getValue() ?? code;
    setCode(runnableCode);
    setOutput('');
    setError('');
    setIsRunning(true);
    setIsPyodideLoading(!pyodidePromise);

    try {
      const pyodide = await getPyodide();
      pyodide.globals.set('__codev_user_code__', runnableCode);
      const pyodideResult = await pyodide.runPythonAsync(RUNNER_SCRIPT);
      const result = normalizePythonResult(pyodideResult);

      if (isPyProxy(pyodideResult)) pyodideResult.destroy?.();

      setOutput([result.stdout, result.stderr].filter(Boolean).join('\n') || 'Code ran successfully with no output.');
      setError(result.error);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'Python execution failed.');
      setOutput('');
    } finally {
      setIsPyodideLoading(false);
      setIsRunning(false);
    }
  }, [code]);

  const isBusy = isEditorLoading || isPyodideLoading || isRunning;

  return (
    <section className="not-prose overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Python Practice</h3>
          <p className="text-sm text-slate-500">Edit and run this Python directly in your browser.</p>
        </div>
        <button
          type="button"
          onClick={runCode}
          disabled={isBusy}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isPyodideLoading ? 'Loading Python...' : isRunning ? 'Running...' : 'Run Python'}
        </button>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr),minmax(260px,0.85fr)]">
        <div className="relative min-h-[320px] border-b border-slate-200 lg:border-b-0 lg:border-r">
          {isEditorLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900 text-sm font-semibold text-white">
              Loading editor...
            </div>
          )}
          <div ref={editorContainerRef} className="h-[320px] w-full sm:h-[420px]" />
        </div>

        <div className="flex min-h-[220px] flex-col bg-slate-950 text-slate-100">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <span>Output</span>
            {isPyodideLoading && <span>Initializing Pyodide...</span>}
          </div>
          <pre className="min-h-[140px] flex-1 overflow-auto whitespace-pre-wrap break-words px-4 py-4 text-sm leading-6">
            {output}
          </pre>
          {error && (
            <pre className="max-h-56 overflow-auto border-t border-red-500/40 bg-red-950/70 px-4 py-4 text-sm leading-6 text-red-100">
              {error}
            </pre>
          )}
        </div>
      </div>
    </section>
  );
}

export default PythonRunner;
