import React from 'react';
import PropTypes from 'prop-types';
import BaseTab from '../../../components/BaseTab';
import GenerateTab from './generateTab';

function Generate(props) {
  return (
    <BaseTab>
      <GenerateTab {...props} />
    </BaseTab>
  );
}

export default Generate;

Generate.propTypes = {
  refetch: PropTypes.func
};
