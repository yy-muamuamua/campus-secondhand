Page({
  data: {
    schoolEmail: '2633479229@qq.com',
    studentId: '',
    verificationCode: '',
    countdown: 0,
    isLoading: false
  },

  bindStudentIdInput(e) {
    this.setData({ studentId: e.detail.value })
  },

  bindVerificationCodeInput(e) {
    this.setData({ verificationCode: e.detail.value })
  },

  showToast(message, icon = 'none') {
    wx.showToast({
      title: message,
      icon: icon,
      duration: 2000
    })
  },

  sendVerificationCode() {
    const { schoolEmail, studentId } = this.data

    if (!studentId) {
      this.showToast('请输入学号')
      return
    }

    this.setData({ isLoading: true })

    wx.cloud.callFunction({
      name: 'sendVerificationCode',
      data: {
        email: schoolEmail,
        type: 'student_verification'
      }
    }).then(res => {
      this.setData({ isLoading: false })
      if (res.result.success) {
        this.showToast('验证码已发送', 'success')
        this.startCountdown()
      } else {
        this.showToast(res.result.message || '发送失败，请重试')
      }
    }).catch(err => {
      this.setData({ isLoading: false })
      this.showToast('发送失败，请重试')
      console.error('发送验证码失败:', err)
    })
  },

  startCountdown() {
    let countdown = 60
    this.setData({ countdown })
    
    const timer = setInterval(() => {
      countdown--
      this.setData({ countdown })
      
      if (countdown <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  },

  submitVerification() {
    const { schoolEmail, studentId, verificationCode } = this.data

    if (!studentId || !verificationCode) {
      this.showToast('请填写完整信息')
      return
    }

    this.setData({ isLoading: true })

    wx.cloud.callFunction({
      name: 'verifyCode',
      data: {
        email: schoolEmail,
        code: verificationCode,
        type: 'student_verification',
        studentId: studentId
      }
    }).then(res => {
      this.setData({ isLoading: false })
      if (res.result.success) {
        this.showToast('认证成功', 'success')
        
        const userInfo = wx.getStorageSync('userInfo') || {}
        wx.setStorageSync('userInfo', {
          ...userInfo,
          role: 'student',
          student_id: studentId,
          email: schoolEmail
        })
        
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/my/index'
          })
        }, 1500)
      } else {
        this.showToast(res.result.message || '认证失败，请检查信息')
      }
    }).catch(err => {
      this.setData({ isLoading: false })
      this.showToast('认证失败，请重试')
      console.error('验证失败:', err)
    })
  }
})
