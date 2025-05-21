// THROUGH PROMISES
const asynchHandler = (requestHandler) =>{
    (res,req,next) => {
        Promise.resolve(requestHandler(res,req,next))
        .catch((err) => next(err))
    }

}

export {asynchHandler}

// const asynchHandler= () => {}
// const asynchHandler= (func) => () => {}
// const asynchHandler = (func) => async() => {}

/* THROUGH TRY CATCH
    const asynchHandler= (fn) = async(req,res,next) => {
    try{
        await fn(req,res,next)

    } catch (error){
        res.status(error.code || 500).json({
            status: false,
            message: error.message || "Internal Server Error"
        })
    }
}
*/