# setup-startup.ps1
# This script creates a Windows Task Scheduler task to run the WSL cron jobs on logon.

$TaskName = "ZidbitNewsCron"
$WslDistro = "Ubuntu" # Update if you use a different WSL distribution
$ScriptPath = "/home/mohit/zidbit/news/crons/start-cron.sh"

$Action = New-ScheduledTaskAction -Execute "wsl.exe" -Argument "-d $WslDistro -e bash $ScriptPath"
$Trigger = New-ScheduledTaskTrigger -AtLogOn
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Force

Write-Host "✅ Task '$TaskName' has been created in Windows Task Scheduler."
Write-Host "It will run the news cron jobs automatically whenever you log into Windows."
Write-Host "You can manage it in Task Scheduler (taskschd.msc)."
