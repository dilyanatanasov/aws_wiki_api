#######################################################################

AWS Lambda API to extract Wikipedia pages with distilled content with TypeScript and Node JS

Here you can find the code that was created to achieve this task.
[.\src\*]
I tried to make the task with objects and the handler to just instantiate the object and call it's main method but this resulted in null response from the aws test queries because the result was not returned by the time the callback was invoked. The solution would be to make it with promises and wait for the end of the data stream and conversion of the results before we use the callback function to return the results. Currently for this to work I have set the result to be displayed with console.log(). I think the distelling is working good and the returned json is constructed as required, the error messages are working and I tried my best doing it the typescript rulles.

[aws_code.js]
The fast solution I found was that if the whole process was done in one single file (handler.js) then I didn't have the problem with the data not getting received on time. Then another one occurred, aws was returning the correct response but with an error message string. I thought this is because I was stringifying the object before returning it but changing this gave me the error message that the return type is an object, not great again. Tried to deploy it and atleast get the error message from the api, but I couldn't make it display the error even after passing the params as a get request to the url.
Example: https://prnt.sc/qyb7f0

I didn't use a console to upload the zip of my code to the aws platform but I uploaded it manually, I know there should be a way to do it using their package.

I could have tried making the api with express but this was not the task
