import React from 'react';
import PropTypes from 'prop-types';
import BaseTab from '../../../components/BaseTab';
import ImportTab from './importTab';

function Import(props) {
  return (
    <BaseTab>
      <ImportTab {...props} />
    </BaseTab>
  );
}

export default Import;

Import.propTypes = {
  tip: PropTypes.string
};
