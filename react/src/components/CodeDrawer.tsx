import { useEffect, useRef, useState } from 'react';

/** A file shown in the drawer: its path in the starters repository, and its source as it runs. */
export type CodeFile = { path: string; source: string };

// Where the repository's files are browsed. Each file links to its own page there.
const repository = 'https://github.com/verbb/comments-starters/blob/main';

// Shiki colours the code. It's loaded the first time the drawer shows a file, so the page itself
// stays small, and the plain source shows until it's ready.
const languages: Record<string, string> = { ts: 'typescript', tsx: 'tsx' };
let shiki: Promise<typeof import('shiki')> | null = null;

async function highlight(file: CodeFile): Promise<string> {
    const { codeToHtml } = await (shiki ??= import('shiki'));

    return codeToHtml(file.source, { lang: languages[file.path.split('.').pop() ?? ''] ?? 'text', theme: 'github-dark', structure: 'inline' });
}

/**
 * "View code" and the drawer it opens: the files behind the page, read from the starter's own
 * source, so what's shown is what runs. A native `<dialog>` gives the focus trap, Escape to close
 * and the backdrop, the same in every starter.
 */
export function CodeDrawer({ title, files }: { title: string; files: CodeFile[] }) {
    const dialog = useRef<HTMLDialogElement>(null);
    const [index, setIndex] = useState(0);
    const [copied, setCopied] = useState(false);
    const [open, setOpen] = useState(false);
    const [highlighted, setHighlighted] = useState<{ file: CodeFile; html: string } | null>(null);
    // The drawer always has at least one file, but the fallback keeps strict index checks happy.
    const file = files[index] ?? files[0] ?? { path: '', source: '' };

    useEffect(() => {
        if (!open) return;

        let current = true;
        highlight(file).then((html) => current && setHighlighted({ file, html })).catch(() => undefined);

        return () => {
            current = false;
        };
    }, [open, file]);

    const copy = async () => {
        await navigator.clipboard.writeText(file.source);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
    };

    return (
        <>
            <button type="button" onClick={() => { dialog.current?.showModal(); setOpen(true); }} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                <span aria-hidden="true" className="font-mono text-xs text-slate-500">&lt;/&gt;</span>
                View the code
            </button>

            <dialog
                ref={dialog}
                aria-labelledby="code-drawer-title"
                // A click on the backdrop lands on the dialog itself, outside its panel.
                onClick={(event) => event.target === dialog.current && dialog.current.close()}
                className="fixed inset-y-0 right-0 left-auto m-0 h-full max-h-none w-full max-w-[min(64rem,92vw)] border-l border-slate-200 bg-white p-0 text-slate-900 shadow-2xl starter-drawer max-md:max-w-none"
            >
                <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-3">
                        <h2 id="code-drawer-title" className="font-semibold">Code for {title}</h2>
                        <button type="button" autoFocus onClick={() => dialog.current?.close()} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                            Close
                        </button>
                    </div>

                    <div className="grid min-h-0 flex-1 md:grid-cols-[14rem_minmax(0,1fr)]">
                        <nav aria-label="Files" className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 p-3 md:flex-col md:border-r md:border-b-0">
                            {files.map((item, position) => (
                                <button
                                    key={item.path}
                                    type="button"
                                    aria-current={position === index ? 'true' : undefined}
                                    onClick={() => setIndex(position)}
                                    className="shrink-0 rounded-md px-2 py-1.5 text-left font-mono break-all text-xs text-slate-600 hover:text-slate-900 aria-[current=true]:bg-white aria-[current=true]:font-semibold aria-[current=true]:text-slate-900 aria-[current=true]:ring-1 aria-[current=true]:ring-slate-200"
                                >
                                    {/* The path inside the starter, since names such as page.tsx repeat. */}
                                    {item.path.split('/').slice(1).join('/')}
                                </button>
                            ))}
                        </nav>

                        <div className="flex min-h-0 min-w-0 flex-col">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-2 text-xs text-slate-500">
                                <span className="font-mono">{file.path}</span>
                                <span className="flex gap-4">
                                    <a href={`${repository}/${file.path}`} target="_blank" rel="noreferrer" className="text-indigo-700 hover:underline">View on GitHub</a>
                                    <button type="button" onClick={copy} className="hover:text-slate-900">{copied ? 'Copied' : 'Copy'}</button>
                                </span>
                            </div>
                            {/* Shiki escapes the source it colours, and the source is this starter's own. */}
                            <pre className="min-h-0 flex-1 overflow-auto bg-slate-950 p-4 text-[13px] leading-6 text-slate-100">
                                {highlighted?.file === file ? <code dangerouslySetInnerHTML={{ __html: highlighted.html }} /> : <code>{file.source}</code>}
                            </pre>
                        </div>
                    </div>
                </div>
            </dialog>
        </>
    );
}
