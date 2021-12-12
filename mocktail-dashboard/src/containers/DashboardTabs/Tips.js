const Tips = [
  'Top left input is the mock endpoint you wish to call.',
  'Text area on the left is the response body you wish to obtain.',
  'Post tab additionally includes another text area for request body you are promising to send. Later, when you call your mock post endpoint, if you did not provide request body as you promised, you will get an exception. (only the keys are compared)',
  'Maximum request size can be up to 40 megabytes',
  'You can delete all apis from cascade tab.',
  'Click on one request template under search bar. You will see the details on the bottom right.',
  'Https protocol is not currently supported.',
  'Endpoints are automatically converted to  lowercase & spaces are deleted.',
  'Copy button simply copies the endpoint',
  'Please open tickets if you encounter any bugs on github.com/Huseyinnurbaki/mocktail',
  'You can email me if you have any questions, feedbacks or suggetions. huseyin.nurbaki@gmail.com ',
  'Original docker image is hhaluk/mocktail',
  'You can have Get & Post Templates for same endpoint',
  'If you have same mock template in the json file you are uploading, last one will be applied.',
  'Only valid request templates will be saved. Others will be rejected. If you are seeing some of your templates after uploading json file, check if your template format is suitable. You can find more about template formats on github.com/Huseyinnurbaki/mocktail ',
  'You can upload a folder full of json files. All possible templates will be used.',
  'You can recover after cascade operation. If you save a mock template, you will lose your chance of recover.',
  'You can update a template by using same endpoint',
  "You can access a mocktail server running on another machine in your local network by changing localhost to machine's local ip addresss.",
  'As you kill docker container, everything related to Mocktail Server will be cleaned up. Pretty easy.',
  'It is safe to stop & restart Mocktail container.',
  'Mockatil is pretty lightweight. Compressed image is around 57mb.'
];

export default Tips;
