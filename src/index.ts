import joplin from 'api';
import { ContentScriptType, ToolbarButtonLocation } from 'api/types';
import { tallyBody } from './tally';

const CONTENT_SCRIPT_ID = 'timeCalcEditor';

joplin.plugins.register({
	onStart: async function() {
		await joplin.contentScripts.register(ContentScriptType.CodeMirrorPlugin, CONTENT_SCRIPT_ID, './contentScript.js');

		joplin.commands.register({
			name: 'tallyTimeBlocks',
			label: 'Tally Time Blocks',
			iconName: 'fas fa-calculator',
			execute: async () => {
				// Markdown editor: edit in place so the view doesn't jump.
				try {
					const handled = await joplin.commands.execute('editor.execCommand', { name: 'timeCalc.tally' });
					if (handled === true) return;
				} catch (error) {
					// Not the CodeMirror editor (e.g. rich text); fall through.
				}

				const note = await joplin.workspace.selectedNote();
				if (!note) return;

				const newBody = tallyBody(note.body);
				if (newBody === note.body) return;

				await joplin.commands.execute('editor.setText', newBody);
			},
		});

		joplin.views.toolbarButtons.create('tallyButton', 'tallyTimeBlocks', ToolbarButtonLocation.EditorToolbar);
	},
});
