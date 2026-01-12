import type { SpaceDef } from '@aa/engine';

interface InspectorProps {
  spaceDef?: SpaceDef;
}

export function Inspector({ spaceDef }: InspectorProps) {
  if (!spaceDef) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>Inspector</div>
        <div style={styles.empty}>Click on a territory or sea zone to view details</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>{spaceDef.name}</div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Info</div>
        <div style={styles.row}>
          <span style={styles.label}>Type:</span>
          <span style={styles.value}>
            {spaceDef.kind === 'land' ? 'Land Territory' : 'Sea Zone'}
          </span>
        </div>
        {spaceDef.kind === 'land' && (
          <>
            <div style={styles.row}>
              <span style={styles.label}>IPC Value:</span>
              <span style={styles.value}>{spaceDef.ipcValue ?? 0}</span>
            </div>
            {spaceDef.originalController && (
              <div style={styles.row}>
                <span style={styles.label}>Original Owner:</span>
                <span style={styles.value}>{spaceDef.originalController}</span>
              </div>
            )}
            {spaceDef.isVictoryCity && (
              <div style={styles.row}>
                <span style={styles.victoryCity}>Victory City</span>
              </div>
            )}
          </>
        )}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          Neighbors ({spaceDef.neighbors.length})
        </div>
        <div style={styles.neighborsList}>
          {spaceDef.neighbors.length === 0 ? (
            <span style={styles.empty}>None</span>
          ) : (
            spaceDef.neighbors.map((n) => (
              <span key={n} style={styles.neighbor}>
                {n}
              </span>
            ))
          )}
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Polygons</div>
        <div style={styles.row}>
          <span style={styles.label}>Count:</span>
          <span style={styles.value}>{spaceDef.polygons.length}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Total Vertices:</span>
          <span style={styles.value}>
            {spaceDef.polygons.reduce((sum, p) => sum + p.length, 0)}
          </span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Center:</span>
          <span style={styles.value}>
            ({spaceDef.labelAnchor.x}, {spaceDef.labelAnchor.y})
          </span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: 280,
    backgroundColor: '#1e1e2e',
    borderLeft: '1px solid #3d3d5c',
    padding: 16,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffd700',
    borderBottom: '1px solid #3d3d5c',
    paddingBottom: 8,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#88a',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    display: 'flex',
    gap: 8,
    fontSize: 13,
  },
  label: {
    color: '#888',
  },
  value: {
    color: '#ddd',
  },
  victoryCity: {
    color: '#ffd700',
    fontWeight: 'bold',
    fontSize: 12,
  },
  neighborsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    maxHeight: 300,
    overflowY: 'auto',
  },
  neighbor: {
    backgroundColor: '#2a2a3e',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    color: '#aaa',
  },
  empty: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
};
