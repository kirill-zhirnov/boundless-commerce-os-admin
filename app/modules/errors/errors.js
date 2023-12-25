// Additional error types:
// =======================
// * HttpError(status, message)
// * ActionError(error, parsedRoute)
// * LogicError
// 	* InvalidArgument
// 	* LengthError
// 	* OutOfRange
// * RuntimeError
// 	* NotImplemented
// 	* UnknownEnumValue
// 	* IllegalState

class HttpError extends Error {
	constructor(status, message, parsedRoute = null) {
		super(message);

		this.status = status;
		this.message = message;
		this.parsedRoute = parsedRoute;

		Error.captureStackTrace(this, HttpError);
	}
}

HttpError.prototype.name = 'HttpError';

class ActionError extends Error {
	constructor(message, error, parsedRoute) {
		super(message);

		this.message = message;
		this.error = error;
		this.parsedRoute = parsedRoute;
		Error.captureStackTrace(this, ActionError);
	}
}

ActionError.prototype.name = 'ActionError';


class PromiseChainError extends Error {
	constructor(message) {
		super(message);

		this.message = message;
		Error.captureStackTrace(this, PromiseChainError);
	}
}

PromiseChainError.prototype.name = 'PromiseChainError';


class LogicError extends Error {
	constructor(message) {
		super(message);

		this.message = message;
		Error.captureStackTrace(this, LogicError);
	}
}

LogicError.prototype.name = 'LogicError';



class InvalidArgument extends LogicError {
	constructor(message) {
		super(message);

		this.message = message;
		Error.captureStackTrace(this, InvalidArgument);
	}
}

InvalidArgument.prototype.name = 'InvalidArgument';



class LengthError extends LogicError {
	constructor(message) {
		super(message);

		this.message = message;
		Error.captureStackTrace(this, LengthError);
	}
}

LengthError.prototype.name = 'LengthError';



class OutOfRange extends LogicError {
	constructor(message) {
		super(message);

		this.message = message;
		Error.captureStackTrace(this, OutOfRange);
	}
}

OutOfRange.prototype.name = 'OutOfRange';



class RuntimeError extends Error {
	constructor(message) {
		super(message);

		this.message = message;
		Error.captureStackTrace(this, RuntimeError);
	}
}

RuntimeError.prototype.name = 'RuntimeError';



class NotImplemented extends RuntimeError {
	constructor(message) {
		super(message);

		this.message = message;
		Error.captureStackTrace(this, NotImplemented);
	}
}

NotImplemented.prototype.name = 'NotImplemented';



class UnknownEnumValue extends RuntimeError {
	constructor(message) {
		super(message);

		this.message = message;
		Error.captureStackTrace(this, UnknownEnumValue);
	}
}

UnknownEnumValue.prototype.name = 'UnknownEnumValue';



class IllegalState extends RuntimeError {
	constructor(message) {
		super(message);

		this.message = message;
		Error.captureStackTrace(this, IllegalState);
	}
}

IllegalState.prototype.name = 'IllegalState';



module.exports = {
	HttpError,
	ActionError,
	LogicError,
	InvalidArgument,
	LengthError,
	OutOfRange,
	RuntimeError,
	NotImplemented,
	UnknownEnumValue,
	IllegalState,
	PromiseChainError
};