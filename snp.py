import os
cmd="netsh interface portproxy add v4tov4 listenport=#LPORT# connectport=#FPORT# connectaddress=#IP#"
os.system(cmd.replace("#LPORT#","444").replace("#FPORT#","555").replace("#IP#","192.168.0.7"))