import React from 'react';
import BaseTab from '../../../components/BaseTab';
import Post from './post';

function PostTab(props) {
  return (
    <BaseTab>
      <Post {...props} />
    </BaseTab>
  );
}

export default PostTab;
