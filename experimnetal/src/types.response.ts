export interface StatusCode {
	Informational: 100 | 101 | 102 | 103
	Success: 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226
	Redirect: 300 | 301 | 302 | 303 | 304 | 307 | 308
	ClientError:
		| 400
		| 401
		| 402
		| 403
		| 404
		| 405
		| 406
		| 407
		| 408
		| 409
		| 410
		| 411
		| 412
		| 413
		| 414
		| 415
		| 416
		| 417
		| 418
		| 421
		| 422
		| 423
		| 424
		| 425
		| 426
		| 428
		| 429
		| 431
		| 451
	ServerError: 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511
	Error: this['ClientError'] | this['ServerError']
}

export interface Statuses {
	informational: 'Informational'
	success: 'Success'
	redirect: 'Redirect'
	clientError: 'ClientError'
	serverError: 'ServerError'
	error: 'ClientError' | 'ServerError'
}

export interface StatusText {
	Informational: 'Continue' | 'SwitchingProtocols' | 'Processing' | 'EarlyHints'
	Success:
		| 'OK'
		| 'Created'
		| 'Accepted'
		| 'NonAuthoritativeInformation'
		| 'NoContent'
		| 'ResetContent'
		| 'PartialContent'
		| 'MultiStatus'
		| 'AlreadyReported'
		| 'IMUsed'
	Redirect:
		| 'MultipleChoices'
		| 'MovedPermanently'
		| 'Found'
		| 'SeeOther'
		| 'NotModified'
		| 'TemporaryRedirect'
		| 'PermanentRedirect'
	ClientError:
		| 'BadRequest'
		| 'Unauthorized'
		| 'PaymentRequired'
		| 'Forbidden'
		| 'NotFound'
		| 'MethodNotAllowed'
		| 'NotAcceptable'
		| 'ProxyAuthenticationRequired'
		| 'RequestTimeout'
		| 'Conflict'
		| 'Gone'
		| 'LengthRequired'
		| 'PreconditionFailed'
		| 'PayloadTooLarge'
		| 'URITooLong'
		| 'UnsupportedMediaType'
		| 'RangeNotSatisfiable'
		| 'ExpectationFailed'
		| 'ImATeapot'
		| 'MisdirectedRequest'
		| 'UnprocessableEntity'
		| 'Locked'
		| 'FailedDependency'
		| 'TooEarly'
		| 'UpgradeRequired'
		| 'PreconditionRequired'
		| 'TooManyRequests'
		| 'RequestHeaderFieldsTooLarge'
		| 'UnavailableForLegalReasons'
	ServerError:
		| 'InternalServerError'
		| 'NotImplemented'
		| 'BadGateway'
		| 'ServiceUnavailable'
		| 'GatewayTimeout'
		| 'HTTPVersionNotSupported'
		| 'VariantAlsoNegotiates'
		| 'InsufficientStorage'
		| 'LoopDetected'
		| 'NotExtended'
		| 'NetworkAuthenticationRequired'
	Error: this['ClientError'] | this['ServerError']
}

export type StatusCodeType = StatusCode[keyof StatusCode]
export type StatusTextType = StatusText[keyof StatusText]