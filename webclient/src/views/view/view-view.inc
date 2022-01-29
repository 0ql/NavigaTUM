<div id="view-view" v-if="view_data">
  <!-- Header image (on mobile) -->
  <div class="show-xs header-image-mobile">
    <img v-if="view_data.img && view_data.img.header_small"
         v-bind:src="'<!-- @echo cdn_prefix -->header-small/' + view_data.img.header_small.name"
         class="img-responsive" alt="header image"
         width="512" height="210" />
  </div>

  <!-- Breadcrumbs -->
  <ul class="breadcrumb">
    <li class="breadcrumb-item" v-for="(p, i) in view_data.parent_names">
      <router-link v-bind="{'to': '/view/' + view_data.parents[i]}">{{ p }}</router-link>
    </li>
  </ul>

  <!-- Entry header / title -->
  <div class="entry-header">
    <div class="title">
      <div class="hide-sm">
        <button class="btn btn-link btn-action btn-sm"
                title="${{ _.view_view.header.copy_link }}$"
                @click="copy_link">
          <i class="icon icon-check" v-if="copied"></i>
          <i class="icon icon-link" v-else></i>
        </button>
      </div>
      <h1>{{ view_data.name }}<!-- <small class="label">Exaktes Ergebnis</small>--></h1>
    </div>
    <div class="columns subtitle">
      <div class="column col-auto">
        <span>{{ view_data.type_common_name }}</span>
      </div>
      <div class="column col-auto col-ml-auto">
        <button class="btn btn-link btn-action btn-sm"
                title="${{ _.view_view.header.feedback }}$"
                @click="entry_feedback(view_data.id)">
          <i class="icon icon-flag"></i>
        </button>
        <!--<button class="btn btn-link btn-action btn-sm"
                title="${{_.view_view.header.favorites}}$">
          <i class="icon icon-bookmark"></i>
        </button>-->
      </div>
    </div>
    <div class="divider"></div>
  </div>

  <!-- First info section (map + infocard) -->
  <div class="columns">
    <!-- Map container -->
    <div class="column col-7 col-xs-12" id="map-container">
      <div class="show-xs">
        <div class="toast toast-warning"
             v-if="view_data.coords.accuracy && view_data.coords.accuracy === 'building'">
          ${{_.view_view.msg.inaccurate_only_building}}$
        </div>
      </div>

      <div id="interactive-map-container"
           v-bind:class="{'d-none': state.map.selected !== 'interactive'}">
        <div>
          <div id="interactive-map" class="loading"></div>
        </div>
      </div>
      <div class="roomfinder-map-container"
           v-bind:class="{'d-none': state.map.selected !== 'roomfinder'}"
           v-if="view_data.maps.roomfinder && view_data.maps.roomfinder.available">
        <img src="<!-- @echo app_prefix -->assets/roomfinder_cross-v2.gif"
             v-bind:style="{'transform': 'translate(' + state.map.roomfinder.x + 'px, ' + state.map.roomfinder.y + 'px)'}"
             id="roomfinder-map-cross">
        <img alt="roomfinder map image"
             class="img-responsive"
             v-bind:src="'<!-- @echo cdn_prefix -->maps/roomfinder/gif/' + state.map.roomfinder.selected_id + '.gif'"
             v-bind:width="state.map.roomfinder.width"
             v-bind:height="state.map.roomfinder.height"
             id="roomfinder-map-img">
        <div>${{_.view_view.map.img_source}}$: Roomfinder</div>
      </div>
      <div class="accordion"
           id="roomfinder-map-select"
           v-bind:class="{'d-none': state.map.selected !== 'roomfinder'}"
           v-if="view_data.maps.roomfinder && view_data.maps.roomfinder.available">
        <input id="map-accordion" type="checkbox" name="accordion-checkbox" hidden>
        <label for="map-accordion" class="btn btn-sm btn-block accordion-header">
          1:{{ view_data.maps.roomfinder.available[state.map.roomfinder.selected_index].scale }},
          {{ view_data.maps.roomfinder.available[state.map.roomfinder.selected_index].name }}
          <i class="icon icon-caret"></i>
        </label>
        <div class="accordion-body" v-if="view_data.maps && view_data.maps.roomfinder">
          <ul class="menu menu-nav">
            <li class="menu-item" v-for="(m, i) in view_data.maps.roomfinder.available">
              <a v-on:click="loadRoomfinderMap(i, true)"
                 v-bind:class="{selected: m.id==state.map.roomfinder.selected_id}">
                1:{{ m.scale }}, {{ m.name }}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div class="btn-group btn-group-block">
        <button class="btn btn-sm"
                v-on:click="loadInteractiveMap(true)"
                v-bind:class="{active: state.map.selected === 'interactive'}">
          ${{_.view_view.map.interactive}}$
        </button>
        <button class="btn btn-sm"
                v-on:click="loadRoomfinderMap(state.map.roomfinder.selected_index, true)"
                v-bind:class="{active: state.map.selected === 'roomfinder'}"
                v-bind:disabled="!(view_data.maps.roomfinder && view_data.maps.roomfinder.available)">
          ${{_.view_view.map.roomfinder}}$
        </button>
      </div>
      <div class="divider" style="margin-top: 10px;"></div>
    </div>

    <!-- Information section (on mobile) -->
    <div class="column col-5 col-xs-12 show-xs mobile-info-section"
         v-if="view_data.props && view_data.props.computed">
      <h2>Informationen</h2>
      <table class="info-table">
        <tbody>
          <tr v-for="prop in view_data.props.computed">
            <td><strong>{{ prop.name }}</strong></td>
            <td>{{ prop.text }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Informationen card (desktop) -->
    <!-- Some elements are currently duplicate, which is not optimal but should be okay
         as long as only little information is there -->
    <div class="column col-5 col-xs-12 hide-xs">
      <div class="card">
        <div class="card-image">
          <img v-if="view_data.img && view_data.img.header_small"
               v-bind:src="'<!-- @echo cdn_prefix -->header-small/' + view_data.img.header_small.name"
               class="img-responsive" alt="header image"
               width="512" height="210" />
        </div>
        <div class="card-header">
          <div class="card-title h5">${{_.view_view.info_title}}$</div>
        </div>
        <div class="card-body">
          <table class="info-table"
                 v-if="view_data.props && view_data.props.computed">
            <tbody>
              <tr v-for="prop in view_data.props.computed">
                <td><strong>{{ prop.name }}</strong></td>
                <td>{{ prop.text }}</td>
              </tr>
            </tbody>
          </table>
          <span v-else>-</span>
          <div class="toast toast-warning"
               v-if="view_data.coords.accuracy && view_data.coords.accuracy === 'building'">
            ${{_.view_view.msg.inaccurate_only_building}}$
          </div>
        </div>
        <!--<div class="card-footer">
            <button class="btn btn-link">Mehr Infos</button>
        </div>-->
      </div>
    </div>
  </div>

<!-- TMP -->
<!--
<div v-if="view_data.sections && view_data.sections.featured">
<div class="columns" style="margin-top: 40px">
    <div class="column"><h5>Featured</h5></div>
</div>
<div style="position: relative;overflow: hidden;white-space: nowrap;">
    <div style="position: absolute;height: 100%;display: flex;background: linear-gradient(-90deg, #fff0 0%, #fffd 100%);">
        <button class="btn btn-action s-circle" style="margin: auto 0;/*! position: absolute; */"><i class="icon icon-arrow-left"></i></button>
    </div>
    <div class="card" style="width: 250px;display: inline-flex;margin-right: 8px;">
        <div class="card-image">
            <img src="<!-- @echo cdn_prefix -- >header-small/mi_0.jpg" class="img-responsive" alt="header image" />
        </div>
        <div class="card-header">
            <div class="card-title h6" style="text-overflow: ellipsis;overflow: hidden;white-space: nowrap;">Teilbibliothek Stammgelände</div>
            <small class="card-subtitle text-gray">Teilbibliothek</small>
            <!--<div class="divider"></div>-- >
        </div>
        <div class="card-body">
            
        </div>
        <!--<div class="card-footer">
            <button class="btn btn-primary">Mehr Infos</button>
        </div>-- >
    </div>
    <div class="card" style="width: 250px;display: inline-flex;margin-right: 8px;height: 200px;vertical-align: top;">
        <div class="card-image" style="display: none;">
            <img alt="header image" src="<!-- @echo cdn_prefix -- >header-small/mi_0.jpg" class="img-responsive">
        </div>
        <div class="card-header">
            <div class="card-title h6" style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">Validierungsautomaten</div>
            <small class="card-subtitle text-gray" style="display: none;">Teilbibliothek</small>
        </div>
        <div class="card-body" style="overflow-y: auto;/*! position: relative; *//*! overflow-x: hidden; */">
            <div class="tile tile-centered">
                <div class="tile-icon">
                    <div class="example-tile-icon">
                        <i class="icon icon-location centered"></i>
                    </div>
                </div>
                <div class="tile-content">
                    <div class="tile-title">
                        <a href="#/view/mi" class="btn btn-link">Süd-Seite</a>
                    </div>
                </div>
                <div class="tile-action">
                    <button class="btn btn-link"><i class="icon icon-arrow-right"></i></button>
                </div>
            </div>
        </div>
    </div>
    <div style="position: absolute;height: 100%;display: flex;background: linear-gradient(90deg, #fff0 0%, #fffd 100%);right: 0;top: 0;">
        <button class="btn btn-action s-circle" style="margin: auto 0;/*! position: absolute; */"><i class="icon icon-arrow-right"></i></button>
    </div>
</div>
</div>-->

  <!-- Buildings overview -->
  <section v-if="view_data.sections && view_data.sections.buildings_overview"
           id="building-overview">
    <div class="columns">
      <div class="column"><h2>${{_.view_view.buildings_overview.title}}$</h2></div>
      <!--<div class="column col-auto">
        <a href="#">Übersichtskarte <i class="icon icon-forward"></i></a>
      </div>-->
    </div>
    <div class="columns">
      <div class="column col-4 col-sm-6 col-xs-12 content"
           v-for="(b, i) in view_data.sections.buildings_overview.entries"
           v-if="i < view_data.sections.buildings_overview.n_visible || state.buildings_overview.expanded">
        <router-link v-bind:to="'/view/' + b.id">
          <div class="tile tile-centered">
            <div class="tile-icon">
              <figure class="avatar avatar-lg">
                <img v-bind:src="b.thumb ? '<!-- @echo cdn_prefix -->thumb/' + b.thumb : '<!-- @echo app_prefix -->assets/thumb-building.png'" alt="thumbnail">
              </figure>
            </div>
            <div class="tile-content">
              <p class="tile-title">{{ b.name }}</p>
              <small class="tile-subtitle text-dark">{{ b.subtext }}</small>
            </div>
            <div class="tile-action">
              <button class="btn btn-link"><i class="icon icon-arrow-right"></i></button>
            </div>
          </div>
        </router-link>
      </div>
    </div>
    <div v-if="view_data.sections.buildings_overview.n_visible < view_data.sections.buildings_overview.entries.length">
      <button class="btn btn-link"
              v-if="!state.buildings_overview.expanded"
              v-on:click="state.buildings_overview.expanded = true">
        <i class="icon icon-arrow-right"></i> ${{_.view_view.buildings_overview.more}}$
      </button>
      <button class="btn btn-link"
              v-if="state.buildings_overview.expanded"
              v-on:click="state.buildings_overview.expanded = false">
        <i class="icon icon-arrow-up"></i> ${{_.view_view.buildings_overview.less}}$
      </button>
    </div>
  </section>

  <!-- Rooms overview -->
  <section id="rooms-overview"
           v-if="view_data.sections && view_data.sections.rooms_overview">
    <div class="columns">
      <div class="column"><h2>${{_.view_view.rooms_overview.title}}$</h2></div>
      <!--<div class="column col-auto">
        <div class="dropdown"><a class="btn btn-link dropdown-toggle" tabindex="0">${{_.view_view.rooms_overview.by_usage}}$ <i class="icon icon-caret"></i></a>
          <ul class="menu">
                  <li class="menu-item"><a href="#dropdowns">nach Nutzung</a></li>
                  <li class="menu-item"><a href="#dropdowns">nach ...</a></li>
          </ul>
        </div>
      </div>-->
    </div>

    <div class="columns content">
      <div class="column col-4 col-md-5 col-xs-12" id="rooms-overview-select">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title h6">
              ${{_.view_view.rooms_overview.by_usage}}$:
            </div>
          </div>
          <div class="panel-body">
            <ul class="menu">
              <li class="menu-item">
                <a v-bind:class="{active: state.rooms_overview.selected === -1}"
                   v-on:click="updateRoomsOverview(-1)">
                  <i class="icon icon-arrow-right"></i> ${{_.view_view.rooms_overview.any}}$
                  <div class="menu-badge">
                    <label class="label">{{ sections.rooms_overview.combined_count }}</label>
                  </div>
                </a>
              </li>
              <li class="divider" data-content=""></li>
              <li class="menu-item"
                  v-for="(u, i) in view_data.sections.rooms_overview.usages">
                <a v-bind:class="{active: i == state.rooms_overview.selected}"
                   v-on:click="updateRoomsOverview(i)">
                  <i class="icon icon-arrow-right"></i> {{ u.name }}
                  <div class="menu-badge">
                    <label class="label">{{ u.count }}</label>
                  </div>
                </a>
              </li>
            </ul>
          </div>
          <div class="panel-footer">
            <button class="btn btn-link btn-sm"
                    v-on:click="updateRoomsOverview(null)">
              ${{_.view_view.rooms_overview.remove_selection}}$
            </button>
          </div>
        </div>
      </div>
      <div class="column col-8 col-md-7 col-xs-12 hide-l" id="rooms-overview-list">
        <div class="show-xs" style="height: 15px"></div>
        <div class="panel">
          <div class="panel-header">
            <div class="input-group">
              <input v-model="state.rooms_overview.filter"
                     placeholder="${{_.view_view.rooms_overview.filter}}$"
                     class="form-input">
              <button class="btn btn-primary input-group-btn"
                      @click="state.rooms_overview.filter = ''">
                <i class="icon icon-cross"></i>
              </button>
            </div>
          </div>
          <div class="panel-body">
            <div v-bind:class="{loading: sections.rooms_overview.loading}"></div>
            <ul class="menu"
                v-if="state.rooms_overview.selected !== null">
                <li class="menu-item"
                    v-for="r in sections.rooms_overview.display_list">
                    <router-link v-bind:to="'/view/' + r.id">
                        <i class="icon icon-location"></i> {{ r.name }}
                    </router-link>
                </li>
            </ul>
          </div>
          <div class="panel-footer">
            <small>
              {{ state.rooms_overview.selected === null
                 ? "${{_.view_view.rooms_overview.choose_usage}}$"
                 : sections.rooms_overview.display_list.length
                   + " ${{_.view_view.rooms_overview.result}}$"
                   + (sections.rooms_overview.display_list.length === 1
                     ? "" : "${{_.view_view.rooms_overview.results_suffix}}$")
                   + (state.rooms_overview.filter === ""
                     ? "" : " (${{_.view_view.rooms_overview.filtered}}$)") }}
            </small>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section v-if="(view_data.img && view_data.img.header_small)">
    <div class="columns">
        <div class="column"><h5>${{_.view_view.sources.title}}$</h5></div>
    </div>
    <p>
      ${{_.view_view.sources.header_img}}$:
      <span>{{ view_data.img.header_small.author.text }}</span>
      <span v-if="view_data.img.header_small.source">•
        <a v-if="view_data.img.header_small.source.url"
           v-bind:href="view_data.img.header_small.source.url"
           target="_blank">
          {{ view_data.img.header_small.source.text }}
        </a>
        <template v-else>{{ view_data.img.header_small.source.text }}</template>
      </span>
      <span v-if="view_data.img.header_small.license">&nbsp;•
        <a v-if="view_data.img.header_small.license.url"
           v-bind:href="view_data.img.header_small.license.url"
           target="_blank">
          {{ view_data.img.header_small.license.text }}
        </a>
        <template v-else>{{ view_data.img.header_small.license.text }}</template>
      </span>
    </p>
  </section>

</div>