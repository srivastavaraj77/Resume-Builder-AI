import { Lock, Mail, User2Icon } from 'lucide-react'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'

const Login = () => {
  const navigate = useNavigate()
  const query = new URLSearchParams(window.location.search)
  const urlState = query.get('state')

  const [authState, setAuthState] = React.useState(urlState || 'login')
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
  })
  const [isLoading, setIsLoading] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState('')
  const [authNotice, setAuthNotice] = React.useState('')
  const [forgotMode, setForgotMode] = React.useState(false)
  const [forgotForm, setForgotForm] = React.useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmNewPassword: '',
  })
  const [forgotMessage, setForgotMessage] = React.useState('')
  const [forgotError, setForgotError] = React.useState('')
  const [isOtpSent, setIsOtpSent] = React.useState(false)
  const [forgotLoading, setForgotLoading] = React.useState(false)

  React.useEffect(() => {
    const notice = sessionStorage.getItem('auth_notice')
    if (notice) {
      setAuthNotice(notice)
      sessionStorage.removeItem('auth_notice')
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setIsLoading(true)
    try {
      const response =
        authState === 'login'
          ? await authApi.login({
              email: formData.email,
              password: formData.password,
            })
          : await authApi.register({
              name: formData.name,
              email: formData.email,
              password: formData.password,
            })

      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      navigate('/app')
    } catch (error) {
      setErrorMessage(error.message || 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleForgotChange = (e) => {
    const { name, value } = e.target
    setForgotForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSendOtp = async () => {
    if (!forgotForm.email) {
      setForgotError('Please enter your email to receive an OTP')
      return
    }

    setForgotError('')
    setForgotMessage('')
    setForgotLoading(true)
    try {
      await authApi.requestPasswordReset({ email: forgotForm.email })
      setIsOtpSent(true)
      setForgotMessage('OTP sent to your email. Use it within 10 minutes to reset your password.')
    } catch (error) {
      setForgotError(error.message || 'Unable to send OTP')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleResetSubmit = async (e) => {
    e.preventDefault()
    setForgotError('')
    setForgotMessage('')
    setForgotLoading(true)
    try {
      await authApi.resetPasswordWithOtp({
        email: forgotForm.email,
        otp: forgotForm.otp,
        newPassword: forgotForm.newPassword,
        confirmNewPassword: forgotForm.confirmNewPassword,
      })
      setAuthNotice('Password updated. Please log in with your new password.')
      setForgotMode(false)
      setIsOtpSent(false)
      setForgotForm({ email: '', otp: '', newPassword: '', confirmNewPassword: '' })
    } catch (error) {
      setForgotError(error.message || 'Unable to reset password')
    } finally {
      setForgotLoading(false)
    }
  }

  const openForgotMode = () => {
    setForgotMode(true)
    setForgotError('')
    setForgotMessage('')
    setIsOtpSent(false)
    setForgotForm({
      email: formData.email,
      otp: '',
      newPassword: '',
      confirmNewPassword: '',
    })
  }

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4'>
      {authNotice && (
        <div className='w-full max-w-[350px] mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800 flex items-start justify-between gap-3'>
          <span>{authNotice}</span>
          <button type='button' onClick={() => setAuthNotice('')} className='text-amber-700 hover:text-amber-900'>x</button>
        </div>
      )}

      {forgotMode ? (
        <form onSubmit={handleResetSubmit} className='sm:w-[350px] w-full text-center border border-gray-300/60 rounded-2xl px-8 bg-white'>
          <h1 className='text-gray-900 text-3xl mt-10 font-medium'>Reset password</h1>
          <p className='text-gray-500 text-sm mt-2'>Enter the email tied to your account.</p>
          <div className='flex items-center w-full mt-6 bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2'>
            <Mail size={13} color='#6B7280' />
            <input
              type='email'
              name='email'
              placeholder='Email id'
              className='border-none outline-none ring-0'
              value={forgotForm.email}
              onChange={handleForgotChange}
              required
            />
          </div>
          <button
            type='button'
            className='mt-4 text-sm text-left text-green-500 underline'
            onClick={handleSendOtp}
            disabled={forgotLoading || !forgotForm.email}
          >
            {forgotLoading ? 'Sending OTP...' : 'Send OTP'}
          </button>

          {isOtpSent && (
            <>
              <div className='flex items-center mt-4 w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2'>
                <input
                  type='text'
                  name='otp'
                  placeholder='Enter OTP'
                  className='border-none outline-none ring-0 w-full'
                  value={forgotForm.otp}
                  onChange={handleForgotChange}
                  required
                />
              </div>
              <div className='flex items-center mt-4 w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2'>
                <input
                  type='password'
                  name='newPassword'
                  placeholder='New password'
                  className='border-none outline-none ring-0 w-full'
                  value={forgotForm.newPassword}
                  onChange={handleForgotChange}
                  required
                />
              </div>
              <div className='flex items-center mt-4 w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2'>
                <input
                  type='password'
                  name='confirmNewPassword'
                  placeholder='Confirm password'
                  className='border-none outline-none ring-0 w-full'
                  value={forgotForm.confirmNewPassword}
                  onChange={handleForgotChange}
                  required
                />
              </div>
              <button
                type='submit'
                className='mt-4 w-full h-11 rounded-full text-white bg-green-500 hover:opacity-90 transition-opacity'
                disabled={forgotLoading}
              >
                {forgotLoading ? 'Resetting...' : 'Reset password'}
              </button>
            </>
          )}

          {forgotMessage && <p className='text-green-500 text-sm mt-2'>{forgotMessage}</p>}
          {forgotError && <p className='text-red-500 text-sm mt-2'>{forgotError}</p>}
          <p
            className='text-gray-500 text-sm mt-3 mb-11 cursor-pointer'
            onClick={() => {
              setForgotMode(false)
              setForgotError('')
              setForgotMessage('')
              setIsOtpSent(false)
              setForgotForm({ email: '', otp: '', newPassword: '', confirmNewPassword: '' })
            }}
          >
            Back to <span className='text-green-500'>login</span>
          </p>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className='sm:w-[350px] w-full text-center border border-gray-300/60 rounded-2xl px-8 bg-white'>
          <h1 className='text-gray-900 text-3xl mt-10 font-medium'>{authState === 'login' ? 'Login' : 'Sign up'}</h1>
          <p className='text-gray-500 text-sm mt-2'>Please {authState} in to continue</p>
          {authState !== 'login' && (
            <div className='flex items-center mt-6 w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2'>
              <User2Icon size={16} color='#6B7280' />
              <input
                type='text'
                name='name'
                placeholder='Name'
                className='border-none outline-none ring-0'
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          )}
          <div className='flex items-center w-full mt-4 bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2'>
            <Mail size={13} color='#6B7280' />
            <input
              type='email'
              name='email'
              placeholder='Email id'
              className='border-none outline-none ring-0'
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className='flex items-center mt-4 w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2'>
            <Lock size={13} color='#6B7280' />
            <input
              type='password'
              name='password'
              placeholder='Password'
              className='border-none outline-none ring-0'
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className='mt-4 text-left text-green-500'>
            <button className='text-sm' type='button' onClick={openForgotMode}>
              Forget password?
            </button>
          </div>
          <button
            type='submit'
            className='mt-2 w-full h-11 rounded-full text-white bg-green-500 hover:opacity-90 transition-opacity'
          >
            {isLoading ? 'Please wait...' : authState === 'login' ? 'Login' : 'Sign up'}
          </button>
          {errorMessage && <p className='text-red-500 text-sm mt-2'>{errorMessage}</p>}
          <p
            onClick={() => setAuthState((prev) => (prev === 'login' ? 'register' : 'login'))}
            className='text-gray-500 text-sm mt-3 mb-11'
          >
            {authState === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <span className='text-green-500 hover:underline'>click here</span>
          </p>
        </form>
      )}
    </div>
  )
}

export default Login
