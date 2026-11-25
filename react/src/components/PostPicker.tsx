import { posts } from '../posts';
import { pillClass } from './Starter';

export function PostPicker({ uri, onChange }: { uri: string; onChange: (uri: string) => void }) {
    return (
        <div role="group" aria-label="Posts" className="flex flex-wrap gap-2">
            {posts.map((post) => (
                <button key={post.uri} type="button" aria-pressed={post.uri === uri} onClick={() => onChange(post.uri)} className={pillClass}>
                    {post.title}
                </button>
            ))}
        </div>
    );
}
