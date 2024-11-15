class apierror extends error{
    constructor(
        statuscode,
message = "something went wrong",
errors =[],
statck =""
){
    super(message)
    this.statuscode = statuscode
    this.data = null
    this.message =message
    this.success = false;
    this.errors = errors

    if(statck){
        this.stack = statck
    }else{
        error.capturestacktrace(this. this.constructor)
    }
}
}

export {apierror}