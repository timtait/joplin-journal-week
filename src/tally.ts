const TIME_ENTRY_RE = /^(\d+(?:\.\d+)?)\s*-\s/;
const TALLY_RE = /^=\s*\d+(?:\.\d+)?\s*$/;

export interface TallyChange {
	from: number;
	to: number;
	insert: string;
}

function formatSum(sum: number): string {
	return String(Math.round(sum * 100) / 100);
}

// Finds runs of consecutive time-entry lines ("1.5 - some task") and returns
// the minimal edits (offsets into the original body) that put a "= <sum>" line
// after each run, replacing any existing tally line so re-running is
// idempotent. Unchanged tallies produce no edit.
export function tallyChanges(body: string): TallyChange[] {
	const lines = body.split('\n');
	const changes: TallyChange[] = [];
	let offset = 0; // start offset of lines[i]
	let i = 0;

	while (i < lines.length) {
		if (!TIME_ENTRY_RE.test(lines[i])) {
			offset += lines[i].length + 1;
			i++;
			continue;
		}

		let sum = 0;
		while (i < lines.length && TIME_ENTRY_RE.test(lines[i])) {
			sum += parseFloat(lines[i].match(TIME_ENTRY_RE)[1]);
			offset += lines[i].length + 1;
			i++;
		}

		const tally = `= ${formatSum(sum)}`;
		if (i < lines.length && TALLY_RE.test(lines[i])) {
			if (lines[i] !== tally) {
				changes.push({ from: offset, to: offset + lines[i].length, insert: tally });
			}
			offset += lines[i].length + 1;
			i++;
		} else if (i < lines.length) {
			changes.push({ from: offset, to: offset, insert: `${tally}\n` });
		} else {
			// Run ends the note: there's no trailing newline to anchor on.
			changes.push({ from: body.length, to: body.length, insert: `\n${tally}` });
		}
	}

	return changes;
}

export function applyChanges(body: string, changes: TallyChange[]): string {
	let out = body;
	for (let i = changes.length - 1; i >= 0; i--) {
		const c = changes[i];
		out = out.slice(0, c.from) + c.insert + out.slice(c.to);
	}
	return out;
}

export function tallyBody(body: string): string {
	return applyChanges(body, tallyChanges(body));
}
