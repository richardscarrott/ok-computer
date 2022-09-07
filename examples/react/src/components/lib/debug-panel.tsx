import { useEffect, useState } from 'react';
import { Button, CornerDialog, Pane } from 'evergreen-ui';
import pretty from 'pretty-format';

interface DebugPanelProps {
  readonly state: Object;
}

const DebugPanel: React.FunctionComponent<DebugPanelProps> = ({ state }) => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) {
      return;
    }
    console.log(state);
  }, [open, state]);
  return (
    <Pane>
      <Button type="button" onClick={() => setOpen((open) => !open)}>
        Toggle Debug Panel
      </Button>
      <CornerDialog isShown={open} title="Debug Panel" confirmLabel="Done">
        <pre>
          {pretty(state, {
            compareKeys: null
          })}
        </pre>
      </CornerDialog>
    </Pane>
  );
};

export default DebugPanel;
