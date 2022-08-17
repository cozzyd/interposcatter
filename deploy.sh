#! /bin/sh 

if [ ! -d dist ] ; then 
  yarn build 
fi 

DEST=${1-/var/lib/grafana/plugins} 
NAME=${2-interposcatter} 

if [ -e "${DEST}/${NAME}" ] ; then
  read -r -p "Nuke ${DEST}/${NAME}? (y/n) " response 
  case "$response" in [yY][eE][sS]|[yY])
    rm -rf $DEST/$NAME
    ;;
  *) 
    exit 1
    ;;
  esac
fi


cp -r dist/ ${DEST}/${NAME} 
