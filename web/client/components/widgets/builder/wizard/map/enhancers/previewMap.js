import { compose, withHandlers } from 'recompose';

export default compose(
    withHandlers({
        onMapViewChanges: ({ onChange = () => { }, editorData = {} }) => map => {
            onChange(editorData.selectedMapId ? `maps[${editorData.selectedMapId}]` : `maps`, map);
            onChange('mapStateSource', map.mapStateSource);
        }
    })
);
