import React from 'react';
import Button from '../../../components/layout/Button';
import Message from '../../../components/I18N/Message';
import FlexBox from '../../../components/layout/FlexBox';

const IsochroneAction = ({ onHandleReset, onHandleRun, loading }) => {
    return (
        <FlexBox className="isochrone-action" gap="sm" centerChildrenVertically>
            <Button onClick={onHandleReset}>
                <Message msgId="isochrone.reset" />
            </Button>
            <Button disabled={loading} variant="primary" onClick={onHandleRun}>
                <Message msgId="isochrone.run" />
            </Button>
        </FlexBox>
    );
};

IsochroneAction.defaultProps = {
    onHandleReset: () => {},
    onHandleRun: () => {},
    loading: false
};

export default IsochroneAction;
