import React from 'react';
import PropTypes from 'prop-types';
import BaseTab from '../../../components/BaseTab';
import ExportTab from './exportTab';

function Export(props) {
  return (
    <BaseTab>
      <ExportTab {...props} />
    </BaseTab>
  );
}

export default Export;

Export.propTypes = {
  tip: PropTypes.string
};
