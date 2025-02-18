import joplin from 'api';
import { ToolbarButtonLocation } from 'api/types';

joplin.plugins.register({
    onStart: async function() {

      joplin.commands.register({
            name: 'createWeeklyJournal',
            label: 'Create Weekly Journal',
            iconName: 'fas fa-book',
            execute: async () => {
              const now = new Date();
              // Calculate the date for Monday of the current week
              const dayOfWeek = now.getDay();
              const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // if Sunday, jump back to previous Monday
              const monday = new Date();
              monday.setDate(now.getDate() + offset);

              // Title: Monday's date in "MM-DD" format
              const month = String(monday.getMonth() + 1).padStart(2, '0');
              const day = String(monday.getDate()).padStart(2, '0');
              const dateString = `${month}-${day}`;

              // Build the note body with headers for each weekday (Monday to Friday)
              const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
              let content = '';
              weekdays.forEach((weekday, i) => {
                const currentDay = new Date(monday);
                currentDay.setDate(monday.getDate() + i);
                content += `# ${weekday} - ${currentDay.getDate()}\n\n\n`;
              });

              const currentFolder = await joplin.workspace.selectedFolder();

              await joplin.data.post(['notes'], null, {
                title: dateString,
                body: content,
                parent_id: currentFolder ? currentFolder.id : undefined,
              });
            },
        });

        // Create a toolbar button that triggers the command
        joplin.views.toolbarButtons.create('createButton', 'createWeeklyJournal', ToolbarButtonLocation.EditorToolbar);
    },
});
