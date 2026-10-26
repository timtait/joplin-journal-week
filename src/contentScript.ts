import { tallyChanges } from './tally';

// Applies tallies as targeted CodeMirror edits rather than replacing the whole
// document, so the scroll position and cursor stay where they are.
export default (_context: { contentScriptId: string }) => ({
	plugin: (codeMirror: any) => {
		codeMirror.registerCommand('timeCalc.tally', () => {
			const view = codeMirror.editor;
			const changes = tallyChanges(view.state.doc.toString());
			if (changes.length) view.dispatch({ changes });
			return true;
		});
	},
});
