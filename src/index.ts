import joplin from 'api';
import { ToolbarButtonLocation } from 'api/types';

const TIME_ENTRY_RE = /^(\d+(?:\.\d+)?)\s*-\s/;
const TALLY_RE = /^=\s*\d+(?:\.\d+)?\s*$/;

function formatSum(sum: number): string {
	return String(Math.round(sum * 100) / 100);
}

// Finds runs of consecutive time-entry lines ("1.5 - some task") and inserts
// a "= <sum>" line after each run, replacing any existing tally line so
// re-running is idempotent.
export function tallyBody(body: string): string {
	const lines = body.split('\n');
	const out: string[] = [];
	let i = 0;

	while (i < lines.length) {
		const match = lines[i].match(TIME_ENTRY_RE);
		if (!match) {
			out.push(lines[i]);
			i++;
			continue;
		}

		let sum = 0;
		while (i < lines.length && TIME_ENTRY_RE.test(lines[i])) {
			sum += parseFloat(lines[i].match(TIME_ENTRY_RE)[1]);
			out.push(lines[i]);
			i++;
		}

		out.push(`= ${formatSum(sum)}`);
		if (i < lines.length && TALLY_RE.test(lines[i])) {
			i++; // drop the stale tally; the fresh one is already emitted
		}
	}

	return out.join('\n');
}

joplin.plugins.register({
	onStart: async function() {
		joplin.commands.register({
			name: 'tallyTimeBlocks',
			label: 'Tally Time Blocks',
			iconName: 'fas fa-calculator',
			execute: async () => {
				const note = await joplin.workspace.selectedNote();
				if (!note) return;

				const newBody = tallyBody(note.body);
				if (newBody === note.body) return;

				// setText refreshes the open editor; data.put persists even if
				// the user immediately switches notes.
				await joplin.commands.execute('editor.setText', newBody);
				await joplin.data.put(['notes', note.id], null, { body: newBody });
			},
		});

		joplin.views.toolbarButtons.create('tallyButton', 'tallyTimeBlocks', ToolbarButtonLocation.EditorToolbar);
	},
});
