/*
 * Federated Wiki : Data Plugin
 *
 * Licensed under the MIT license.
 * https://github.com/fedwiki/wiki-plugin-data/blob/master/LICENSE.txt
 */

// lots of cases, ward will try these
// http://nmsi.localhost:1111/view/cotton-in-the-field/view/tier-1-material-summary/cotton.localhost:1111/talk-about-wool/view/cotton-fabric

window.plugins.data = {
  emit: (div, item) => {
    $('<p />').addClass('readout').appendTo(div).text(summary(item))
    $('<p />')
      .addClass('label')
      .appendTo(div)
      .html(wiki.resolveLinks(item.text || 'data'))
  },

  bind: (div, item) => {
    let lastThumb = null
    div
      .find('.readout')
      .on('mousemove', e => {
        const offset = e.offsetX ?? e.pageX - $(this).offset().left
        const thumb = thumbs(item)[Math.floor((thumbs(item).length * offset) / e.target.offsetWidth)]
        if (thumb === lastThumb || (lastThumb = thumb) === null) return
        refresh(thumb)
        $(div).trigger('thumb', thumb)
      })
      .on('dblclick', () => {
        wiki.dialog(`JSON for ${item.text}`, $('<pre/>').text(JSON.stringify(item, null, 2)))
      })
    div.find('.label').on('dblclick', () => {
      wiki.textEditor(div, item)
    })
    $('.main').on('thumb', (evt, thumb) => {
      if (thumb !== lastThumb && thumbs(item).indexOf(thumb) !== -1) {
        refresh(thumb)
      }
    })

    const value = obj => {
      if (obj == null) return NaN
      switch (obj.constructor) {
        case Number:
          return obj
        case String:
          return +obj
        case Array:
          return value(obj[0])
        case Object:
          return value(obj.value)
        case Function:
          return obj()
        default:
          return NaN
      }
    }

    const average = thumb => {
      const values = item.data.map(obj => value(obj[thumb])).filter(obj => !isNaN(obj))
      const result = values.reduce((m, n) => m + n, 0) / values.length
      return result.toFixed(2)
    }

    const readout = thumb => {
      if (item.columns) return average(thumb)
      if (!item.data.object) return summary(item)
      const field = item.data[thumb]
      if (field.value) return `${field.value}`
      if (field.constructor === Number) return `${field.toFixed(2)}`
      return NaN
    }

    const label = thumb => {
      if (item.columns && item.data.length > 1) return `Averaged:<br>${thumb}`
      return thumb
    }

    const refresh = thumb => {
      div.find('.readout').text(readout(thumb))
      div.find('.label').html(label(thumb))
    }
  },
}

const summary = item => {
  if (item.columns) {
    return `${item.data.length}x${item.columns.length}`
  }
  if (item.data?.nodes && item.data?.links) return `${item.data.nodes.length}/${item.data.links.length}`
  return `1x${thumbs(item).length}`
  // return 'data'   // unreachable!
}

const thumbs = item => {
  if (item.columns) {
    return item.columns
  }
  return Object.keys(item.data)
}
