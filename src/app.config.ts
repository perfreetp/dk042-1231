export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/workbench/index',
    'pages/settlement/index',
    'pages/mine/index',
    'pages/job-detail/index',
    'pages/publish-job/index',
    'pages/audit-applicants/index',
    'pages/task-detail/index',
    'pages/withdraw/index',
    'pages/evaluation/index',
    'pages/my-jobs/index',
    'pages/my-favorites/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTitleText: '快工邦',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F7F8FA'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#FF6B35',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/workbench/index',
        text: '工作台'
      },
      {
        pagePath: 'pages/settlement/index',
        text: '结算'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
