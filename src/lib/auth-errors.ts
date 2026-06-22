import { CredentialsSignin } from 'next-auth'

export class CredentialsInvalidError extends CredentialsSignin {
  code = 'credentials_invalid'
}

export class MFARequiredError extends CredentialsSignin {
  code = 'mfa_required'
}

export class OTPExpiredError extends CredentialsSignin {
  code = 'otp_expired'
}

export class OTPInvalidError extends CredentialsSignin {
  code = 'otp_invalid'
}

export class OTPMaxAttemptsError extends CredentialsSignin {
  code = 'otp_max_attempts'
}

export class AccountBlockedError extends CredentialsSignin {
  code = 'account_blocked'
}
