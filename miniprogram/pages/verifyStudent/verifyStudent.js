Page({
  data: {
    schoolEmail: '',
    studentId: '',
    verificationCode: '',
    countdown: 0,
    isLoading: false
  },

  // 输入学校邮箱
  bindSchoolEmailInput(e) {
    this.setData({
      schoolEmail: e.detail.value
    })
  },

  // 输入学号
  bindStudentIdInput(e) {
    this.setData({
      studentId: e.detail.value
    })
  },

  // 输入验证码
  bindVerificationCodeInput(e) {
    this.setData({
      verificationCode: e.detail.value
    })
  },

  // 发送验证码
  sendVerificationCode() {
    const { schoolEmail, studentId } = this.data

    if (!schoolEmail) {
      wx.showToast({
        title: '请输入学校邮箱',
        icon: 'none'
      })
      return
    }

    if (!studentId) {
      wx.showToast({
        title: '请输入学号',
        icon: 'none'
      })
      return
    }

    // 验证邮箱格式（学校邮箱）
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(schoolEmail)) {
      wx.showToast({
        title: '请输入有效的邮箱地址',
        icon: 'none'
      })
      return
    }

    this.setData({ isLoading: true })

    // 调用云函数发送验证码
    wx.cloud.callFunction({
      name: 'sendVerificationCode',
      data: {
        email: schoolEmail,
        type: 'student_verification'
      }
    }).then(res => {
      this.setData({ isLoading: false })
      if (res.result.success) {
        wx.showToast({
          title: '验证码已发送',
          icon: 'success'
        })
        // 开始倒计时
        this.startCountdown()
      } else {
        wx.showToast({
          title: '发送失败，请重试',
          icon: 'none'
        })
      }
    }).catch(err => {
      this.setData({ isLoading: false })
      wx.showToast({
        title: '发送失败，请重试',
        icon: 'none'
      })
      console.error('发送验证码失败:', err)
    })
  },

  // 开始倒计时
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

  // 提交认证
  submitVerification() {
    const { schoolEmail, studentId, verificationCode } = this.data

    if (!schoolEmail || !studentId || !verificationCode) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    this.setData({ isLoading: true })

    // 调用云函数验证
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
        wx.showToast({
          title: '认证成功',
          icon: 'success'
        })
        
        // 更新本地存储的用户信息
        wx.setStorageSync('userInfo', {
          ...wx.getStorageSync('userInfo'),
          role: 'student'
        })
        
        // 跳转到个人中心
        setTimeout(() => {
          wx.navigateTo({
            url: '/pages/profile/profile'
          })
        }, 1500)
      } else {
        wx.showToast({
          title: '认证失败，请检查信息',
          icon: 'none'
        })
      }
    }).catch(err => {
      this.setData({ isLoading: false })
      wx.showToast({
        title: '认证失败，请重试',
        icon: 'none'
      })
      console.error('验证失败:', err)
    })
  }
})